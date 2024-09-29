import { readdirSync, statSync } from 'node:fs'
import path, { join } from 'node:path'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { config } from '../../config.js'
import logger from '../../logger'
import type { ToolEntry } from '../../types'
import { validateParams } from './toolHelper.js'

const paramSchema = z.object({
  path: z.string().describe('The path of the directory'),
})

export const toolReadDirectory: ToolEntry = {
  fn: async (input: unknown) => {
    try {
      const { projectId, path } = validateParams(paramSchema, input)
      const p = join(config.tempDir, projectId, path)

      const stat = statSync(p)

      if (!stat.isDirectory()) {
        return `${path} is not a directory`
      }

      const files = readdirSync(p)

      return files
        .map((file) => {
          const f = join(p, file)
          const s = statSync(f)
          return s.isDirectory() ? `${file} (directory)` : `${file} (file)`
        })
        .join('\n')
    } catch (err) {
      logger.error({ err, input }, 'Wrong input in tool call read_directory')
      return 'Error: Sorry, but unable to read directory'
    }
  },
  schema: {
    type: 'function',
    function: {
      name: 'read_directory',
      description:
        'Get the content of the directory - list of files and sub folders in that directory',
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  },
}
