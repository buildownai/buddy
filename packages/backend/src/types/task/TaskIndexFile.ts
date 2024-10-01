import type { TaskBase } from './TaskBase.js'
import { TaskKind } from './TaskKind.js'

export type TaskIndexFile = TaskBase & {
  kind: TaskKind.INDEX_FILE
  payload: {
    pageContent: string
    file: string
  }
}

export const isIndexFileTask = (input: {
  kind: TaskKind
}): input is TaskIndexFile => {
  return input.kind === TaskKind.INDEX_FILE
}
