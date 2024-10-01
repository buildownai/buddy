export interface Project {
  id: string
  name: string
  description: string
  icon?: string
  repoUrl: string
  localFolder?: string
  createdAt: Date
  updatedAt: Date
  indexJob?: string
}
