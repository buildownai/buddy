import { readFileSync } from 'node:fs'
import path, { join } from 'node:path'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { config } from '../../config.js'
import logger from '../../logger.js'
import { validateParams } from './toolHelper.js'

const paramSchema = z.object({
  path: z.string().describe('The path to the file'),
})

export const toolReadFile = (projectId: string) => {
  return {
    type: 'function' as const,
    function: {
      parse: JSON.parse,
      function: async (input: unknown) => {
        try {
          const { path } = validateParams(paramSchema, input)
          const p = join(config.tempDir, projectId, path)
          return readFileSync(p, 'utf8')
        } catch (err) {
          logger.error({ err, input }, 'Wrong input in tool call read_file')
          return 'Error: Sorry, but unable to read file'
        }
      },
      name: 'read_file',
      description: 'Get the file content of a file in the repository',
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  }
}
