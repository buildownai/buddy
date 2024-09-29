import { BaseApi } from './base.js'
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
}
