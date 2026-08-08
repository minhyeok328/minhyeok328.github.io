import type { Project } from '../types/portfolio'
import { ImageWithFallback } from './ImageWithFallback'

interface ProjectImageProps {
  project: Pick<Project, 'image' | 'title'>
  className: string
  fallbackClassName: string
}

export function ProjectImage({ project, className, fallbackClassName }: ProjectImageProps) {
  return (
    <ImageWithFallback
      className={className}
      fallbackClassName={fallbackClassName}
      src={project.image}
      alt={`${project.title} ?꾨줈?앺듃 ?대?吏`}
      fallback={project.title.slice(0, 2)}
    />
  )
}
