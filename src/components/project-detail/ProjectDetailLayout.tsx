import type { ReactNode } from 'react'
import { DetailHeader } from '../DetailHeader'
import { Footer } from '../Footer'

interface ProjectDetailLayoutProps {
  children: ReactNode
  githubUrl: string
  name: string
}

export function ProjectDetailLayout({
  children,
  githubUrl,
  name,
}: ProjectDetailLayoutProps) {
  return (
    <>
      <DetailHeader githubUrl={githubUrl} />
      <main id="top" className="site-container project-detail-page">{children}</main>
      <Footer name={name} />
    </>
  )
}
