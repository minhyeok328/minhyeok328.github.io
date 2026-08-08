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
      alt={`${project.title} 프로젝트 이미지`}
      fallback={project.title.slice(0, 2)}
    />
  )
}
