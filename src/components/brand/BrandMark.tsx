import { Link } from 'react-router-dom'
import { branding } from '@/lib/branding'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md'
  variant?: 'light' | 'dark'
  to?: string
}

export function BrandMark({
  className,
  showWordmark = true,
  size = 'md',
  variant = 'light',
  to = '/',
}: BrandMarkProps) {
  const iconSize = size === 'sm' ? 'size-8 text-sm' : 'size-10 text-base'
  const isDark = variant === 'dark'

  const content = (
    <>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg font-semibold shadow-sm',
          iconSize,
          isDark
            ? 'bg-brand-gold text-brand-blue'
            : 'bg-brand-blue text-white',
        )}
        aria-hidden
      >
        F
      </div>
      {showWordmark ? (
        <div className="min-w-0 text-left">
          <p
            className={cn(
              'truncate font-semibold leading-tight tracking-tight',
              isDark ? 'text-white' : 'text-foreground',
            )}
          >
            {branding.name}
          </p>
          <p
            className={cn(
              'truncate text-xs',
              isDark ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            {branding.tagline}
          </p>
        </div>
      ) : null}
    </>
  )

  return (
    <Link
      to={to}
      className={cn('flex items-center gap-3', className)}
      aria-label={`${branding.name} home`}
    >
      {content}
    </Link>
  )
}
