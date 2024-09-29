export interface SSEProgressMessage {
  event: 'progress'
  message: string
  progress: number
  step: string
}

export interface SSEInfoMessage {
  event: 'info'
  message: string
  totalSteps: number
  steps: string[]
}

export interface SSECompleteMessage {
  event: 'complete'
  message: string
  projectId: string
}

export interface SSEErrorMessage {
  event: 'error'
  message: string
}

export type SSEMessage = SSEProgressMessage | SSEInfoMessage | SSECompleteMessage | SSEErrorMessage
