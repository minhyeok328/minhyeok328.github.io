import { Link } from 'react-router'
import { DetailHeader } from '../components/DetailHeader'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { portfolioData } from '../data/portfolio'
import { notFoundMetadata } from '../lib/projectMetadata'

export function NotFoundPage() {
  return (
    <>
      <DocumentMetadata metadata={notFoundMetadata} />
      <DetailHeader githubUrl={portfolioData.profile.githubUrl} />
      <main id="top" className="site-container not-found-page">
        <p>404</p>
        <h1>페이지를 찾을 수 없습니다.</h1>
        <p>주소가 바뀌었거나 존재하지 않는 페이지입니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </main>
      <Footer name={portfolioData.profile.name} />
    </>
  )
}
