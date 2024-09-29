import type { TreeViewItem } from '../types/file.js'
import { BaseApi } from './base.js'
import type { Project } from './types.js'

export class ProjectApi extends BaseApi {
  static async getProjects(): Promise<Project[]> {
    const response = await ProjectApi.fetch('/v1/projects')
    return response.json()
  }

  static async getProjectFileTree(projectId: string): Promise<TreeViewItem[]> {
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/files`)
    return response.json()
  }

  static async getFile(projectId: string, path: string): Promise<string> {
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/files/${path}`)
    return response.text()
  }

  static async getCompletion(projectId: string, message: string, suffix: string, language: string) {
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/fill-middle-code`, {
      method: 'post',
      body: JSON.stringify({
        message,
        suffix,
        language,
      }),
    })
    const complete = await response.text()
    return complete
  }
}
