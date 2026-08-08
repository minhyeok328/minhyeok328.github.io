import { Outlet, type RouteObject } from 'react-router'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PortfolioHomePage } from '../pages/PortfolioHomePage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'

const appRouteLayout = <Outlet />

export function createAppRoutes(pageSessionToken: string): RouteObject[] {
  return [
    {
      element: appRouteLayout,
      children: [
        { index: true, element: <PortfolioHomePage pageSessionToken={pageSessionToken} /> },
        { path: 'projects/:projectId/', element: <ProjectDetailPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
