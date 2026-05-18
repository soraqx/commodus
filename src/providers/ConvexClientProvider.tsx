import { ConvexProvider, ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  console.warn(
    'Missing VITE_CONVEX_URL. Run `npx convex dev` and copy the URL into .env.local.',
  )
}

const convex = new ConvexReactClient(convexUrl ?? 'https://placeholder.convex.cloud')

type ConvexClientProviderProps = {
  children: ReactNode
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
