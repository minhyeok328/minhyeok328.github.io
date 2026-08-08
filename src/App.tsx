import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { appRoutes } from './router/AppRouter'

const appRouter = createBrowserRouter(appRoutes)

export default function App() {
  return <RouterProvider router={appRouter} />
}
