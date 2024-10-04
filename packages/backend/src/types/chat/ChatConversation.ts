import type { ChatMessage } from './ChatMessage.js'

export type ChatConversation = {
  id: string
  summary: string
  messages: ChatMessage[]
  createdAt: Date
}
