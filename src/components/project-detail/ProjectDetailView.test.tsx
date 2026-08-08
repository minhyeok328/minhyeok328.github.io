import { createRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Project } from '../../types/portfolio'
import { ProjectDetailView } from './ProjectDetailView'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-project',
    order: 2,
    stage: 'Test Stage',
    title: '?뚯뒪???꾨줈?앺듃',
    description: '?뚯뒪???꾨줈?앺듃 ?ㅻ챸',
    contribution: ['?뚯뒪????븷 ?붿빟', '援ы쁽 A', '援ы쁽 B'],
    growth: '?뚯뒪???깆옣',
    technologies: ['TypeScript', 'React', 'Vitest'],
    teamTechnologies: ['Django', 'AWS'],
    githubUrl: 'https://github.com/example/test-project',
    image: '',
    ...overrides,
  }
}

function renderDetail(project: Project = makeProject()) {
  const previousProject = makeProject({ id: 'previous', title: '?댁쟾 ?꾨줈?앺듃' })
  const nextProject = makeProject({ id: 'next', title: '?ㅼ쓬 ?꾨줈?앺듃' })

  return render(
    <MemoryRouter>
      <ProjectDetailView
        project={project}
        previousProject={previousProject}
        nextProject={nextProject}
        headingRef={createRef<HTMLHeadingElement>()}
      />
    </MemoryRouter>,
  )
}

describe('ProjectDetailView', () => {
  it('renders current project data once and keeps optional sections absent', () => {
    const project = makeProject()
    renderDetail(project)

    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
    expect(screen.getAllByText(project.description)).toHaveLength(1)
    expect(screen.getAllByText(project.contribution[0])).toHaveLength(1)
    expect(screen.getAllByText(project.growth)).toHaveLength(1)

    const contribution = screen.getByRole('region', { name: '吏곸젒 湲곗뿬' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      project.contribution[1],
      project.contribution[2],
    ])

    expect(screen.queryByRole('region', { name: '?꾨줈?앺듃 媛쒖슂' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '湲곗닠 ?ㅺ퀎? ?먮떒' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '?깆옣怨??뚭퀬' })).not.toBeInTheDocument()

    const codeLink = screen.getByRole('link', { name: 'GitHub?먯꽌 肄붾뱶 蹂닿린' })
    expect(codeLink).toHaveAttribute('href', project.githubUrl)
    expect(codeLink).toHaveAttribute('target', '_blank')
    expect(codeLink).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByRole('link', { name: '?꾨줈?앺듃 紐⑸줉' })).toHaveAttribute('href', '/#projects')
    expect(screen.getByRole('link', { name: '?댁쟾 쨌 ?댁쟾 ?꾨줈?앺듃' })).toHaveAttribute(
      'href',
      '/projects/previous/',
    )
    expect(screen.getByRole('link', { name: '?ㅼ쓬 쨌 ?ㅼ쓬 ?꾨줈?앺듃' })).toHaveAttribute(
      'href',
      '/projects/next/',
    )
  })

  it('uses explicit detail copy without removing any contributions', () => {
    const project = makeProject({
      cardRoleSummary: '紐낆떆????븷 ?붿빟',
      detail: {
        overview: ['?곸꽭 ?꾨줈?앺듃 媛쒖슂'],
        decisions: [{
          title: '?곹깭 愿由?寃곗젙',
          situation: '?щ윭 ?붾㈃??媛숈? ?쒕쾭 ?곹깭瑜??ъ슜?덉뒿?덈떎.',
          choice: '?쒕쾭 ?곹깭瑜?蹂꾨룄濡?愿由ы뻽?듬땲??',
          reason: '以묐났 ?붿껌怨?遺덉씪移섎? 以꾩씠湲??꾪빐?쒖엯?덈떎.',
          implementation: '怨듯넻 Query Key瑜??곸슜?덉뒿?덈떎.',
          result: '?곗씠???먮쫫???⑥닚?댁죱?듬땲??',
          reflection: '寃쎄퀎 ?뺤쓽瑜????쇱컢 ?덉뼱???⑸땲??',
        }],
        retrospective: ['紐낆떆???뚭퀬'],
      },
    })
    renderDetail(project)

    expect(screen.getByText('紐낆떆????븷 ?붿빟')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '?꾨줈?앺듃 媛쒖슂' })).toHaveTextContent(
      '?곸꽭 ?꾨줈?앺듃 媛쒖슂',
    )
    expect(screen.getByRole('region', { name: '湲곗닠 ?ㅺ퀎? ?먮떒' })).toHaveTextContent(
      '?곹깭 愿由?寃곗젙',
    )
    expect(screen.getByRole('region', { name: '?깆옣怨??뚭퀬' })).toHaveTextContent('紐낆떆???뚭퀬')

    const contribution = screen.getByRole('region', { name: '吏곸젒 湲곗뿬' })
    expect(within(contribution).getAllByRole('listitem').map((item) => item.textContent)).toEqual(
      project.contribution,
    )
  })

  it('omits explicitly empty optional sections and team technologies', () => {
    renderDetail(makeProject({
      teamTechnologies: [],
      detail: { overview: [], decisions: [], retrospective: [] },
    }))

    expect(screen.getByRole('region', { name: '吏곸젒 ?ъ슜 湲곗닠' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '? ?쒖뒪???곕룞' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '?꾨줈?앺듃 媛쒖슂' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '湲곗닠 ?ㅺ퀎? ?먮떒' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '?깆옣怨??뚭퀬' })).not.toBeInTheDocument()
  })

  it('shows only next at the first boundary and only previous at the last boundary', () => {
    const previousProject = makeProject({ id: 'previous', title: '?댁쟾 ?꾨줈?앺듃' })
    const nextProject = makeProject({ id: 'next', title: '?ㅼ쓬 ?꾨줈?앺듃' })
    const first = render(
      <MemoryRouter>
        <ProjectDetailView
          project={makeProject()}
          previousProject={null}
          nextProject={nextProject}
          headingRef={createRef<HTMLHeadingElement>()}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: '?댁쟾 쨌 ?댁쟾 ?꾨줈?앺듃' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '?ㅼ쓬 쨌 ?ㅼ쓬 ?꾨줈?앺듃' })).toBeInTheDocument()
    first.unmount()

    render(
      <MemoryRouter>
        <ProjectDetailView
          project={makeProject()}
          previousProject={previousProject}
          nextProject={null}
          headingRef={createRef<HTMLHeadingElement>()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '?댁쟾 쨌 ?댁쟾 ?꾨줈?앺듃' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '?ㅼ쓬 쨌 ?ㅼ쓬 ?꾨줈?앺듃' })).not.toBeInTheDocument()
  })
})
