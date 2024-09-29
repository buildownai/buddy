export interface SSEChatContent {
  event: 'token'
  role: string
  content: string
}

export interface SSEChatInfo {
  event: 'start' | 'end' | 'error' | 'info'
  content: string
}

export type SSEChatMessage = SSEChatContent | SSEChatInfo
