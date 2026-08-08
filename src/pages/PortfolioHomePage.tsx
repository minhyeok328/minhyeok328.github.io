import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProjectDetailModal } from '../components/ProjectDetailModal'
import { portfolioData } from '../data/portfolio'
import { useActiveSection } from '../hooks/useActiveSection'
import { useProjectModalHistory } from '../hooks/useProjectModalHistory'
import { getNavigationItems } from '../lib/portfolio'
import { homeMetadata } from '../lib/projectMetadata'
import { getOrderedProjects } from '../lib/projects'
import { AboutSection } from '../sections/AboutSection'
import { ContactSection } from '../sections/ContactSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { HeroSection } from '../sections/HeroSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'

const projects = getOrderedProjects(portfolioData)

interface PortfolioHomePageProps {
  pageSessionToken: string
}

export function PortfolioHomePage({ pageSessionToken }: PortfolioHomePageProps) {
  const navigationItems = getNavigationItems(portfolioData)
  const observedSectionIds = ['top', ...navigationItems.map((item) => item.id)]
  const activeSection = useActiveSection(observedSectionIds)
  const {
    modalState,
    activeProject,
    previousProject,
    nextProject,
    openProject,
    switchProject,
    closeProject,
  } = useProjectModalHistory({ projects, sessionToken: pageSessionToken })

  return (
    <>
      <DocumentMetadata metadata={homeMetadata} />
      <div id="portfolio-app-shell">
        <Header items={navigationItems} activeSection={activeSection} />
        <main>
          <HeroSection profile={portfolioData.profile} />
          <AboutSection messages={portfolioData.about} />
          <ProjectsSection
            flagshipProject={portfolioData.flagshipProject}
            journeyProjects={portfolioData.journeyProjects}
            onOpenProject={openProject}
          />
          <SkillsSection skillGroups={portfolioData.skillGroups} />
          <ExperienceSection experiences={portfolioData.experiences} />
          <ContactSection profile={portfolioData.profile} />
        </main>
        <Footer name={portfolioData.profile.name} />
      </div>
      {activeProject && modalState?.view === 'project' ? (
        <ProjectDetailModal
          project={activeProject}
          previousProject={previousProject}
          nextProject={nextProject}
          openingCardId={modalState.openingCardId}
          homeScrollY={modalState.homeScrollY}
          onClose={closeProject}
          onPreviousProject={previousProject
            ? () => switchProject(previousProject.id)
            : undefined}
          onNextProject={nextProject
            ? () => switchProject(nextProject.id)
            : undefined}
        />
      ) : null}
    </>
  )
}
