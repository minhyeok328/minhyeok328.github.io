export interface Profile {
  name: string
  greeting: string
  role: string
  description: string
  profileImage: string
  resumeUrl: string
  blogUrl: string
  email: string
  githubUrl: string
  linkedinUrl: string
}

export interface Project {
  id: string
  order: number
  stage: string
  title: string
  description: string
  contribution: string[]
  growth: string
  technologies: string[]
  teamTechnologies?: string[]
  githubUrl: string
  image: string
}

export interface SkillGroup {
  title: string
  primary: string[]
  experience: string[]
}

export interface ExperienceEntry {
  id: string
  period: string
  organization: string
  title: string
  description: string
}

export interface PortfolioData {
  profile: Profile
  about: string[]
  flagshipProject: Project
  journeyProjects: Project[]
  skillGroups: SkillGroup[]
  experiences: ExperienceEntry[]
}
