export interface Project {
  id: string
  name: string
  description: string
  icon?: string
  repositoryUrl: string
  localFolder?: string
  createdAt: Date
  updatedAt: Date
  indexJob?: string
}
