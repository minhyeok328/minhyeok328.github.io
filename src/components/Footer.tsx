interface FooterProps {
  name: string
}

export function Footer({ name }: FooterProps) {
  return (
    <footer className="site-container site-footer">
      <p>© {new Date().getFullYear()} {name}</p>
      <a href="#top">맨 위로</a>
    </footer>
  )
}
