import { setTimeout } from 'node:timers/promises'
import logger from '../logger.js'
import { runJob } from './runJob.js'

export const startBackgroundJobRunner = async () => {
  logger.debug('Starting background task runner...')

  while (true) {
    await runJob()
    await setTimeout(2_000, null)
  }
}
