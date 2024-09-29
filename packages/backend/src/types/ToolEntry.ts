import type { Tool } from 'ollama'
import type { SendSSEFunction } from './SendSSEFunction.js'

export type ToolEntry = {
  fn: <T extends Record<string, unknown>>(input: T, sendSSE: SendSSEFunction) => unknown
  schema: Tool
}
