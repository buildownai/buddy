import type { SSEChatMessage } from './SSEChatMessage.js'

export type SendSSEFunction = (event: SSEChatMessage['event'], content: string) => Promise<void>
