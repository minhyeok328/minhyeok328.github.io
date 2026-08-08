import type { RouteObject } from 'react-router'
import { PortfolioHomePage } from '../pages/PortfolioHomePage'

export function createAppRoutes(pageSessionToken: string): RouteObject[] {
  return [
    {
      path: '/',
      element: <PortfolioHomePage pageSessionToken={pageSessionToken} />,
    },
  ]
}
