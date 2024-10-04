export type ChatMessage = {
  conversationId: string
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}
