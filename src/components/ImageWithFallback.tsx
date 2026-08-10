import { useState } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fallback: string
  className?: string
  fallbackClassName?: string
  loading?: 'eager' | 'lazy'
  decoding?: 'async' | 'auto' | 'sync'
}

export function ImageWithFallback({
  src,
  alt,
  fallback,
  className,
  fallbackClassName = className,
  loading,
  decoding,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(src.length === 0)

  if (failed) {
    return (
      <div className={fallbackClassName} role="img" aria-label={`${alt} 대체 이미지`}>
        {fallback}
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => setFailed(true)}
    />
  )
}
