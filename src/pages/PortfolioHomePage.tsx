import { DocumentMetadata } from '../components/DocumentMetadata'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { portfolioData } from '../data/portfolio'
import { useActiveSection } from '../hooks/useActiveSection'
import { getNavigationItems } from '../lib/portfolio'
import { homeMetadata } from '../lib/projectMetadata'
import { AboutSection } from '../sections/AboutSection'
import { ContactSection } from '../sections/ContactSection'
import { ExperienceSection } from '../sections/ExperienceSection'
import { HeroSection } from '../sections/HeroSection'
import { ProjectsSection } from '../sections/ProjectsSection'
import { SkillsSection } from '../sections/SkillsSection'

export function PortfolioHomePage() {
  const navigationItems = getNavigationItems(portfolioData)
  const observedSectionIds = ['top', ...navigationItems.map((item) => item.id)]
  const activeSection = useActiveSection(observedSectionIds)

  return (
    <>
      <DocumentMetadata metadata={homeMetadata} />
      <Header items={navigationItems} activeSection={activeSection} />
      <main>
        <HeroSection profile={portfolioData.profile} />
        <AboutSection messages={portfolioData.about} />
        <ProjectsSection
          flagshipProject={portfolioData.flagshipProject}
          journeyProjects={portfolioData.journeyProjects}
        />
        <SkillsSection skillGroups={portfolioData.skillGroups} />
        <ExperienceSection experiences={portfolioData.experiences} />
        <ContactSection profile={portfolioData.profile} />
      </main>
      <Footer name={portfolioData.profile.name} />
    </>
  )
}
