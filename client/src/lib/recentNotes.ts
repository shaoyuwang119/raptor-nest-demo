// Remembers the last few notes this browser opened, for the Home page's
// "pick up where you left off" row. Kept in localStorage since it's a
// per-device convenience, not something worth a database table.
const KEY = 'raptor-nest-recent-notes'
const MAX = 6

export function getRecentNoteIds(): number[] {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(ids) ? ids.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function rememberNote(id: number) {
  try {
    const ids = [id, ...getRecentNoteIds().filter((n) => n !== id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* storage blocked - the row just falls back to popular notes */
  }
}
