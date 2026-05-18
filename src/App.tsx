import { RouterProvider } from 'react-router-dom'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { router } from '@/routes'

function App() {
  return (
    <ConvexClientProvider>
      <RouterProvider router={router} />
    </ConvexClientProvider>
  )
}

export default App
