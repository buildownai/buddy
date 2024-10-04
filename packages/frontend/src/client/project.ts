import { backbone } from '../backbone/index.js'
import { deleteFile, putFile } from '../store/browserEnv.js'
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
    const p = path.startsWith('/') ? path.slice(1) : path
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/files/${p}`)
    return response.text()
  }

  static async putFile(projectId: string, path: string, content: string): Promise<void> {
    const p = path.startsWith('/') ? path.slice(1) : path
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/files/${p}`, {
      method: 'put',
      body: JSON.stringify({
        content,
      }),
    })
    if (response.ok) {
      putFile(path, content)
      backbone.emit('file_upserted', { path })
    }
  }

  static async deleteFile(projectId: string, path: string): Promise<void> {
    const p = path.startsWith('/') ? path.slice(1) : path
    const response = await ProjectApi.fetch(`/v1/projects/${projectId}/files/${p}`, {
      method: 'delete',
    })
    if (response.ok) {
      deleteFile(path)
      backbone.emit('file_upserted', { path })
    }
  }
}
