// Everything specific to one school lives here. To set The Raptor Nest up
// for a different school, change this file (plus the logos in
// public/brand/) - nothing else in the app hardcodes LASA.

export const SCHOOL = {
  appName: 'The Raptor Nest',
  schoolName: 'LASA',
  fullName: 'Liberal Arts and Science Academy',
  district: 'Austin ISD',
  mascot: 'Raptors',
  cheer: 'Go Raptors!',
  tagline: 'Everything happening at LASA, all in one place.',
}

// A/B block schedule. Mon/Wed are A days and Tue/Thu are B days. Fridays
// alternate, so one known Friday anchors the pattern.
// TODO: confirm the anchor against the real LASA calendar.
const A_DAYS = [1, 3] // Monday, Wednesday
const B_DAYS = [2, 4] // Tuesday, Thursday
const FRIDAY_ANCHOR = { date: '2026-10-16', day: 'A' as const }

export type DayType = 'A' | 'B'

export function getDayType(date: Date): DayType | null {
  const weekday = date.getDay()
  if (A_DAYS.includes(weekday)) return 'A'
  if (B_DAYS.includes(weekday)) return 'B'
  if (weekday !== 5) return null // weekend

  const anchor = new Date(`${FRIDAY_ANCHOR.date}T12:00:00`)
  const day = new Date(date)
  day.setHours(12, 0, 0, 0)
  const weeksApart = Math.round((day.getTime() - anchor.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const sameAsAnchor = weeksApart % 2 === 0
  return sameAsAnchor ? FRIDAY_ANCHOR.day : FRIDAY_ANCHOR.day === 'A' ? 'B' : 'A'
}

// Bulletin post categories and their badge colors
export const POST_CATEGORIES = ['School', 'Club', 'Event'] as const
export type PostCategory = (typeof POST_CATEGORIES)[number]

export const CATEGORY_STYLES: Record<PostCategory, { badge: string; dot: string; label: string }> = {
  School: {
    label: 'School',
    badge: 'bg-sea-sky text-sea-teal-dark',
    dot: 'bg-sea-teal',
  },
  Club: {
    label: 'Club',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
  },
  Event: {
    label: 'Event',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
}

export function categoryStyle(category?: string | null) {
  return CATEGORY_STYLES[(category as PostCategory) ?? 'School'] ?? CATEGORY_STYLES.School
}

// 'YYYY-MM-DD' for a local date (not UTC, so late-evening dates don't slip a day)
export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromDateKey(key: string) {
  return new Date(`${key}T12:00:00`)
}
