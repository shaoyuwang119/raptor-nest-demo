import type { PostType } from '@/types'
import { categoryStyle, fromDateKey, toDateKey } from '@/lib/school'

// Calendar-style list: a little date block, then what's happening
function UpcomingList({
  events,
  empty = 'Nothing on the calendar yet.',
}: {
  events: PostType[]
  empty?: string
}) {
  if (events.length === 0) {
    return <p className="font-hand text-xl text-slate-500">{empty}</p>
  }

  const today = toDateKey(new Date())

  return (
    <ul className="flex flex-col">
      {events.map((event) => {
        const date = fromDateKey(event.event_date!)
        const isToday = event.event_date === today
        const style = categoryStyle(event.category)
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 border-b border-dashed border-slate-300 py-2.5 last:border-b-0"
          >
            <div
              className={`flex w-11 shrink-0 flex-col items-center rounded-md border py-1 leading-none ${
                isToday
                  ? 'bg-lasa-navy border-lasa-navy text-lasa-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </span>
              <span className="font-serif text-lg font-semibold">{date.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800" title={event.title}>
                {event.title}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} />
                {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' })}
                {event.event_time && ` · ${event.event_time}`}
                {event.location && ` · ${event.location}`}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default UpcomingList
