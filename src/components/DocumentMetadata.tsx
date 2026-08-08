import { useEffect } from 'react'
import type { PageMetadata } from '../lib/projectMetadata'

interface DocumentMetadataProps {
  metadata: PageMetadata
}

function getOrCreateTitle() {
  const existing = document.getElementById('page-title')

  if (existing instanceof HTMLTitleElement) {
    return { element: existing, created: false }
  }

  if (existing) {
    throw new Error('page-title must be a title element')
  }

  const element = document.createElement('title')
  element.id = 'page-title'
  document.head.append(element)
  return { element, created: true }
}

function getOrCreateMeta(id: string, attribute: 'name' | 'property', value: string) {
  const existing = document.getElementById(id)

  if (existing instanceof HTMLMetaElement) {
    return { element: existing, created: false }
  }

  if (existing) {
    throw new Error(`${id} must be a meta element`)
  }

  const element = document.createElement('meta')
  element.id = id
  element.setAttribute(attribute, value)
  document.head.append(element)
  return { element, created: true }
}

function applyDocumentMetadata(metadata: PageMetadata) {
  const title = getOrCreateTitle()
  const metaEntries = [
    [getOrCreateMeta('page-description', 'name', 'description'), metadata.description],
    [getOrCreateMeta('page-og-title', 'property', 'og:title'), metadata.ogTitle],
    [getOrCreateMeta('page-og-description', 'property', 'og:description'), metadata.ogDescription],
    [getOrCreateMeta('page-og-url', 'property', 'og:url'), metadata.ogUrl],
  ] as const
  const previousTitle = title.element.textContent ?? ''
  const previousContents = metaEntries.map(([entry]) => entry.element.content)

  title.element.textContent = metadata.title
  metaEntries.forEach(([entry, content]) => {
    entry.element.content = content
  })

  return () => {
    if (title.created) {
      title.element.remove()
    } else {
      title.element.textContent = previousTitle
    }

    metaEntries.forEach(([entry], index) => {
      if (entry.created) {
        entry.element.remove()
      } else {
        entry.element.content = previousContents[index]
      }
    })
  }
}

export function DocumentMetadata({ metadata }: DocumentMetadataProps) {
  const { title, description, ogTitle, ogDescription, ogUrl } = metadata

  useEffect(() => applyDocumentMetadata({
    title,
    description,
    ogTitle,
    ogDescription,
    ogUrl,
  }), [description, ogDescription, ogTitle, ogUrl, title])

  return null
}
