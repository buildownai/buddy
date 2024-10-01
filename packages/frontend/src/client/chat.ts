import { BaseApi } from './base.js'
import { ProjectApi } from './project.js'
import type { Conversation, ConversationHistory } from './types.js'

export class ChatApi extends BaseApi {
  static async getRecentConversation(projectId: string): Promise<Conversation> {
    const response = await ChatApi.fetch(`/v1/projects/${projectId}/chat`)
    return response.json()
  }
  static async getConversations(projectId: string): Promise<ConversationHistory[]> {
    const response = await ChatApi.fetch(`/v1/projects/${projectId}/chat/history`)
    return response.json()
  }
  static async getConversation(projectId: string, conversationId: string): Promise<Conversation> {
    const response = await ChatApi.fetch(`/v1/projects/${projectId}/chat/history/${conversationId}`)
    return response.json()
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
