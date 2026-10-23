// A small imitation of supabase-js's query builder, covering the calls the
// app actually makes: select (with embedded relations like
// `subject:subjects(id, name)`), insert, update, delete, the common
// filters, order, limit, single and maybeSingle.
import { nextId, persist, ready, table, type Row } from './store'

type Filter = { path: string; test: (value: any) => boolean }
type Result = { data: any; error: { message: string } | null; count: null; status: number; statusText: string }

// ---------- select-string parsing ----------

type Field =
  | { kind: 'all' }
  | { kind: 'column'; name: string }
  | { kind: 'embed'; alias: string; table: string; inner: boolean; fields: Field[] }

function splitTopLevel(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts.map((p) => p.trim()).filter(Boolean)
}

function parseSelect(s: string): Field[] {
  return splitTopLevel(s).map((part): Field => {
    if (part === '*') return { kind: 'all' }
    const m = part.match(/^(?:(\w+):)?(\w+)(!inner)?\((.*)\)$/s)
    if (m) {
      const [, alias, tableName, inner, inside] = m
      return { kind: 'embed', alias: alias ?? tableName!, table: tableName!, inner: !!inner, fields: parseSelect(inside!) }
    }
    return { kind: 'column', name: part }
  })
}

// Foreign keys follow the app's naming: `subject:subjects(...)` on notes
// joins notes.subject_id -> subjects.id
function resolveEmbed(row: Row, field: Extract<Field, { kind: 'embed' }>): Row | null {
  const fk = row[`${field.alias}_id`] ?? row[`${field.table.replace(/s$/, '')}_id`]
  if (fk === undefined) return null
  return table(field.table).find((r) => r.id === fk) ?? null
}

function project(row: Row, fields: Field[]): Row {
  const out: Row = {}
  for (const f of fields) {
    if (f.kind === 'all') {
      for (const [k, v] of Object.entries(row)) if (!k.startsWith('_')) out[k] = v
    } else if (f.kind === 'column') {
      out[f.name] = row[f.name] ?? null
    } else {
      const child = resolveEmbed(row, f)
      out[f.alias] = child ? project(child, f.fields) : null
    }
  }
  return out
}

function getPath(row: Row, path: string) {
  return path.split('.').reduce<any>((v, k) => (v == null ? undefined : v[k]), row)
}

function likeToRegex(pattern: string, caseInsensitive: boolean) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'is' : 's')
}

// ---------- builder ----------

export class DemoQuery implements PromiseLike<Result> {
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private selectStr: string | null = null
  private payload: Row[] = []
  private patch: Row = {}
  private filters: Filter[] = []
  private orders: { col: string; ascending: boolean }[] = []
  private limitN: number | null = null
  private rangeFrom = 0
  private mode: 'many' | 'single' | 'maybeSingle' = 'many'
  private tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(columns = '*') {
    this.selectStr = columns
    return this
  }
  insert(values: Row | Row[]) {
    this.action = 'insert'
    this.payload = Array.isArray(values) ? values : [values]
    return this
  }
  upsert(values: Row | Row[]) {
    return this.insert(values)
  }
  update(values: Row) {
    this.action = 'update'
    this.patch = values
    return this
  }
  delete() {
    this.action = 'delete'
    return this
  }

  private where(path: string, test: (v: any) => boolean) {
    this.filters.push({ path, test })
    return this
  }
  // Values compare loosely so `.eq('id', '3')` matches id 3, like Postgres casting does
  eq(col: string, val: any) {
    return this.where(col, (v) => v == val)
  }
  neq(col: string, val: any) {
    return this.where(col, (v) => v != val)
  }
  gt(col: string, val: any) {
    return this.where(col, (v) => v > val)
  }
  gte(col: string, val: any) {
    return this.where(col, (v) => v >= val)
  }
  lt(col: string, val: any) {
    return this.where(col, (v) => v < val)
  }
  lte(col: string, val: any) {
    return this.where(col, (v) => v <= val)
  }
  in(col: string, vals: any[]) {
    return this.where(col, (v) => vals.some((x) => x == v))
  }
  is(col: string, val: any) {
    return this.where(col, (v) => (v ?? null) === val)
  }
  like(col: string, pattern: string) {
    const re = likeToRegex(pattern, false)
    return this.where(col, (v) => v != null && re.test(String(v)))
  }
  ilike(col: string, pattern: string) {
    const re = likeToRegex(pattern, true)
    return this.where(col, (v) => v != null && re.test(String(v)))
  }
  order(col: string, opts: { ascending?: boolean } = {}) {
    this.orders.push({ col, ascending: opts.ascending ?? true })
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  range(from: number, to: number) {
    this.rangeFrom = from
    this.limitN = to - from + 1
    return this
  }
  single() {
    this.mode = 'single'
    return this
  }
  maybeSingle() {
    this.mode = 'maybeSingle'
    return this
  }

  then<A = Result, B = never>(
    onFulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: any) => B | PromiseLike<B>) | null
  ): Promise<A | B> {
    return this.run().then(onFulfilled, onRejected)
  }

  private matches(row: Row, fields: Field[]) {
    // Filters can reach into embedded rows (e.g. 'subject.name'), so test
    // against the row with its relations attached
    const withEmbeds = this.filters.some((f) => f.path.includes('.')) ? { ...row, ...project(row, fields.filter((f) => f.kind === 'embed')) } : row
    for (const f of fields) {
      if (f.kind === 'embed' && f.inner && withEmbeds[f.alias] == null) return false
    }
    return this.filters.every((f) => f.test(getPath(withEmbeds, f.path)))
  }

  private async run(): Promise<Result> {
    await ready()
    const rows = table(this.tableName)
    const fields = parseSelect(this.selectStr ?? '*')
    let result: Row[]

    if (this.action === 'insert') {
      const usesNumericIds = rows.length === 0 || typeof rows[0]!.id === 'number'
      result = this.payload.map((values) => {
        const row: Row = { ...values }
        if (row.id === undefined && usesNumericIds && !['note_saves', 'user_subjects'].includes(this.tableName)) {
          row.id = nextId(this.tableName)
        }
        if (row.created_at === undefined && this.tableName !== 'subjects') {
          row.created_at = new Date().toISOString()
        }
        rows.push(row)
        return row
      })
      persist()
    } else if (this.action === 'update') {
      result = rows.filter((r) => this.matches(r, fields))
      result.forEach((r) => Object.assign(r, this.patch))
      persist()
    } else if (this.action === 'delete') {
      result = rows.filter((r) => this.matches(r, fields))
      const doomed = new Set(result)
      const kept = rows.filter((r) => !doomed.has(r))
      rows.length = 0
      rows.push(...kept)
      persist()
    } else {
      result = rows.filter((r) => this.matches(r, fields))
    }

    for (const { col, ascending } of [...this.orders].reverse()) {
      result = [...result].sort((a, b) => {
        const x = a[col]
        const y = b[col]
        if (x === y) return 0
        if (x == null) return 1
        if (y == null) return -1
        return (x < y ? -1 : 1) * (ascending ? 1 : -1)
      })
    }
    if (this.limitN !== null) result = result.slice(this.rangeFrom, this.rangeFrom + this.limitN)

    // Mutations only return rows when .select() was chained, like supabase-js
    const returnsRows = this.action === 'select' || this.selectStr !== null
    let data: any = returnsRows ? result.map((r) => project(r, fields)) : null

    if (this.mode !== 'many' && returnsRows) {
      if (data.length > 1 || (data.length === 0 && this.mode === 'single')) {
        return {
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned' },
          count: null,
          status: 406,
          statusText: 'Not Acceptable',
        }
      }
      data = data[0] ?? null
    }

    return { data, error: null, count: null, status: 200, statusText: 'OK' }
  }
}
