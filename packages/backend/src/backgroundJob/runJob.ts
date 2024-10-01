import { generateSrcFileDescription } from '../llm/generateSrcFileDescription.js'
import logger from '../logger.js'
import { knowledgeRepository } from '../repository/knowledge.js'
import { taskRepository } from '../repository/task.js'
import { TaskStatus, isIndexFileTask } from '../types/index.js'

export const runJob = async () => {
  let task = await taskRepository.getNextPendingTask()
  while (task) {
    logger.debug({ taskId: task.id.id, kind: task.kind, status: task.status }, 'Processing task')
    try {
      // Task: index file
      if (isIndexFileTask(task)) {
        const description = await generateSrcFileDescription(
          task.payload.pageContent,
          task.payload.file
        )
        await knowledgeRepository.addCodeKnowledge(
          task.project.id as string,
          task.payload.file,
          description
        )
        logger.debug({ taskId: task.id.id }, 'File indexed')
      }
      await taskRepository.updateTaskStatus(task.id.id as string, TaskStatus.FINISHED)
    } catch (err) {
      logger.error({ err })
      await taskRepository.updateTaskStatus(task.id.id as string, TaskStatus.FAILED)
    }
    task = await taskRepository.getNextPendingTask()
  }
}
