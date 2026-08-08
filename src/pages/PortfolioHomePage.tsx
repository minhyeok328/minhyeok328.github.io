import { useMemo } from 'react'
import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProjectDetailModal } from '../components/ProjectDetailModal'
import { portfolioData } from '../data/portfolio'
import { useActiveSection } from '../hooks/useActiveSection'
import { useProjectModalHistory } from '../hooks/useProjectModalHistory'
import { useProjectModalPresence } from '../hooks/useProjectModalPresence'
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
  const projectModalState = modalState?.view === 'project' ? modalState : null
  const openingCardId = projectModalState?.openingCardId ?? null
  const homeScrollY = projectModalState?.homeScrollY ?? null
  const liveModalSnapshot = useMemo(() => {
    if (!activeProject || openingCardId === null || homeScrollY === null) {
      return null
    }

    return {
      project: activeProject,
      previousProject,
      nextProject,
      openingCardId,
      homeScrollY,
    }
  }, [activeProject, homeScrollY, nextProject, openingCardId, previousProject])
  const {
    displayedValue: displayedModalSnapshot,
    phase: modalPhase,
    completeExit,
  } = useProjectModalPresence(liveModalSnapshot)
  const displayedPreviousProjectId = displayedModalSnapshot?.previousProject?.id ?? null
  const displayedNextProjectId = displayedModalSnapshot?.nextProject?.id ?? null

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
      {displayedModalSnapshot ? (
        <ProjectDetailModal
          project={displayedModalSnapshot.project}
          previousProject={displayedModalSnapshot.previousProject}
          nextProject={displayedModalSnapshot.nextProject}
          openingCardId={displayedModalSnapshot.openingCardId}
          homeScrollY={displayedModalSnapshot.homeScrollY}
          onClose={closeProject}
          onPreviousProject={displayedPreviousProjectId
            ? () => switchProject(displayedPreviousProjectId)
            : undefined}
          onNextProject={displayedNextProjectId
            ? () => switchProject(displayedNextProjectId)
            : undefined}
          phase={modalPhase}
          onExitComplete={completeExit}
        />
      ) : null}
    </>
  )
}
