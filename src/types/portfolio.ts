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

export interface ProjectDecision {
  title: string
  situation: string
  choice: string
  reason: string
  implementation: string
  result?: string
  reflection?: string
}

export interface ProjectDetail {
  overview?: string[]
  decisions?: ProjectDecision[]
  retrospective?: string[]
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
  cardRoleSummary?: string
  detail?: ProjectDetail
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
