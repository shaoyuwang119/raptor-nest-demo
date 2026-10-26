import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'

import { supabase } from '@/lib/supabase'
import { formatEventDay } from '@/lib/bulletin'
import { toDateKey } from '@/lib/school'
import type { Todo } from '@/types'

// Unfinished first (soonest due date first, undated last), then finished
function sortTodos(todos: Todo[]) {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date || b.due_date) return a.due_date ? -1 : 1
    return a.created_at.localeCompare(b.created_at)
  })
}

function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [unavailable, setUnavailable] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        // The real database needs the todos table from server/sql first
        if (error) setUnavailable(true)
        else setTodos(sortTodos(data ?? []))
      })
  }, [userId])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const text = title.trim()
    if (!text) return
    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: userId, title: text, due_date: due || null, done: false })
      .select()
      .single()
    if (error || !data) return
    setTodos((prev) => sortTodos([...prev, data]))
    setTitle('')
    setDue('')
    setAdding(false)
  }

  async function toggle(todo: Todo) {
    setTodos((prev) => sortTodos(prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))))
    await supabase.from('todos').update({ done: !todo.done }).eq('id', todo.id)
  }

  async function remove(todo: Todo) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    await supabase.from('todos').delete().eq('id', todo.id)
  }

  if (unavailable) return null

  const today = toDateKey(new Date())
  const remaining = todos.filter((t) => !t.done).length

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-medium text-slate-800">To do</h2>
        <span className="text-xs text-slate-500">{remaining} left</span>
      </div>

      <ul className="mt-3 flex flex-col">
        {todos.map((todo) => {
          const overdue = !todo.done && todo.due_date && todo.due_date < today
          return (
            <li key={todo.id} className="group flex items-start gap-2.5 py-1.5">
              <button
                onClick={() => toggle(todo)}
                aria-label={todo.done ? 'Mark not done' : 'Mark done'}
                className={`mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded border transition ${
                  todo.done
                    ? 'bg-lasa-navy border-lasa-navy text-lasa-white dark:bg-slate-500 dark:border-slate-500'
                    : 'hover:border-sea-teal border-slate-400 bg-white'
                }`}
              >
                {todo.done && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm leading-snug ${
                    todo.done ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {todo.title}
                </p>
                {todo.due_date && !todo.done && (
                  <p className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                    {overdue ? 'Overdue · ' : 'Due '}
                    {formatEventDay(todo.due_date)}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(todo)}
                aria-label="Delete"
                className="cursor-pointer text-xs text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </li>
          )
        })}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-2 flex flex-col gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
            placeholder="What do you need to do?"
            maxLength={120}
            className="focus:border-sea-teal w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Due date (optional)"
              className="focus:border-sea-teal min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-lasa-navy text-lasa-white cursor-pointer rounded-md px-3 text-xs font-medium dark:ring-1 dark:ring-slate-400"
            >
              Add
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="font-hand hover:text-sea-teal mt-1 flex cursor-pointer items-center gap-1.5 text-lg text-slate-500 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" /> add a to-do
        </button>
      )}
    </section>
  )
}

export default TodoList
