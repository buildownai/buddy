import type { TaskStatus } from './TaskStatus.js'

export type TaskBase = {
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  branch?: string
}
