import { Outlet, ScrollRestoration, type RouteObject } from 'react-router'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PortfolioHomePage } from '../pages/PortfolioHomePage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'

const appRouteLayout = (
  <>
    <Outlet />
    <ScrollRestoration />
  </>
)

export const appRoutes: RouteObject[] = [
  {
    element: appRouteLayout,
    children: [
      { index: true, element: <PortfolioHomePage /> },
      { path: 'projects/:projectId/', element: <ProjectDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
