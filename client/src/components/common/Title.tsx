import type { ReactNode } from 'react'

type TitleProps = {
  title: ReactNode
  description?: ReactNode
}

export default function Title({ title, description }: TitleProps) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-4xl font-medium text-slate-800">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
    </div>
  )
}
