import type { ChatMessage } from 'src/types/chat.js'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface User {
  id: string
  email: string
  name: string
  language: string
  createdAt: string
}

export interface ApiError {
  message: string
  code: string
}

// Add the Project interface
export interface Project {
  id: string
  name: string
  description: string

  repositoryUrl: string
  icon: string
  created: string
}

export interface Conversation {
  id: string
  createdAt: string
  summary: string
  messages: ChatMessage[]
}

export interface ConversationHistory {
  id: string
  summary: string
  createdAt: string
  content: string
}
