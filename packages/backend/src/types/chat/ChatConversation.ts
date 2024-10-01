import type { ChatMessage } from './ChatMessage.js'

export type ChatConversation = {
  id: string
  messages: ChatMessage[]
  createdAt: Date
}
