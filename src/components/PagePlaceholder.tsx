import type { ReactNode } from 'react'

type PagePlaceholderProps = {
  title: string
  description: string
  children?: ReactNode
}

export default function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section className="page-card">
      <h1>{title}</h1>
      <p>{description}</p>
      {children && <div className="page-actions">{children}</div>}
    </section>
  )
}
