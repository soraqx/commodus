import { branding } from '@/lib/branding'

type PageHeaderProps = {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-2 border-b border-border/60 pb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
        {branding.name}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      ) : null}
    </header>
  )
}
