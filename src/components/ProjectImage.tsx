import type { Project } from '../types/portfolio'
import { ImageWithFallback } from './ImageWithFallback'

interface ProjectImageProps {
  project: Pick<Project, 'image' | 'title'>
  className: string
  fallbackClassName: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto' | 'sync'
}

export function ProjectImage({
  project,
  className,
  fallbackClassName,
  loading,
  decoding,
}: ProjectImageProps) {
  return (
    <ImageWithFallback
      className={className}
      fallbackClassName={fallbackClassName}
      src={project.image}
      alt={`${project.title} 프로젝트 이미지`}
      fallback={project.title.slice(0, 2)}
      loading={loading}
      decoding={decoding}
    />
  )
}
