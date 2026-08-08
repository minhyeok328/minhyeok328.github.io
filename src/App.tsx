import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { createAppRoutes } from './router/AppRouter'
import { createPageSessionToken } from './router/modalHistory'

const pageSessionToken = createPageSessionToken()
const appRouter = createBrowserRouter(createAppRoutes(pageSessionToken))

export default function App() {
  return <RouterProvider router={appRouter} />
}
