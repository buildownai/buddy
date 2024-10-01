import { type Message, Ollama } from 'ollama'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { config } from '../../config.js'
import logger from '../../logger.js'
import type { ToolEntry } from '../../types/index.js'
import { validateParams } from './toolHelper.js'

import { toolReadFile } from './readFile.js'
import { toolWriteFile } from './writeFile.js'

const availableFunctions = new Map<string, ToolEntry>()

availableFunctions.set(toolReadFile.schema.function.name, toolReadFile)
availableFunctions.set(toolWriteFile.schema.function.name, toolWriteFile)

const tools = Array.from(availableFunctions.entries()).map(([name, { schema }]) => schema)

const paramSchema = z.object({
  steps: z.array(
    z.string().describe('The single task to perform in this step in natural language')
  ),
})

export const toolStepAgent: ToolEntry = {
  fn: async (input: unknown, sendSSE) => {
    const log = logger.child({ tool: 'step_agent' })
    try {
      const { projectId, steps } = validateParams(paramSchema, input)
      const messages: Message[] = [
        {
          role: 'system',
          content: `You are a helpful AI assistant who can use tools. You will get tasks to perform by a large language model.
Your answers should be short and concise. Do not add thoughts or reasoning and only use the tools you really need.
Do not write or change files if you not explicitly asked to do so.
If you change files or content, always work with the full content and ensure to not remove any important code or information.
You can only write the complete and valid content to a file. Partial updates are not allowed at all.
You should never remove any code or important information.
Try to categorize the output in success or fail.
          `,
        },
      ]

      log.debug({ steps }, 'Steps')

      const ollama = new Ollama({ host: config.ollama.url })

      for (const step of steps) {
        messages.push({
          role: 'user',
          content: step,
        })

        log.debug({ step }, 'Execting step')

        const response = await ollama.chat({
          model: config.ollama.models.chat,
          messages,
          stream: false,
          tools,
          options: {
            temperature: 0,
          },
        })
        log.debug({ response: response.message }, 'Step response')

        if (response.message.tool_calls) {
          for (const tool of response.message.tool_calls) {
            log.debug(`Calling function ${tool.function.name}`)
            const toolEntry = availableFunctions.get(tool.function.name)
            if (!toolEntry) {
              messages.push({
                role: 'tool',
                content: `Error: There is no tool ${tool.function.name} available`,
              })
              continue
            }
            const functionResponse = await toolEntry.fn(
              { ...tool.function.arguments, projectId },
              sendSSE
            )

            const content =
              typeof functionResponse === 'string'
                ? functionResponse
                : JSON.stringify(functionResponse)

            await sendSSE(
              'info',
              `Calling tool ${tool.function.name} with arguments ${JSON.stringify(
                tool.function.arguments
              )}: ${content}`
            )

            messages.push({
              role: 'tool',
              content,
            })
          }

          const r = await ollama.chat({
            model: config.ollama.models.chat,
            messages,
            stream: false,
            options: {
              temperature: 0,
            },
          })

          await sendSSE('info', `Step result: ${r.message.content}`)

          messages.push(r.message)
        } else {
          await sendSSE('info', `Step: step => response: ${response.message.content}`)
        }
      }

      log.debug('Asking for Final response')

      messages.push({
        role: 'user',
        content: 'Return the overall final result',
      })

      const finalResponse = await ollama.chat({
        model: config.ollama.models.chat,
        messages,
        stream: false,
        options: {
          temperature: 0,
        },
      })

      log.debug('Final step agent response')

      return finalResponse.message.content
    } catch (err) {
      log.error({ err, input }, 'Wrong input in tool call read_file')
      return 'Error: Sorry, but unable to read file'
    }
  },
  schema: {
    type: 'function',
    function: {
      name: 'step_agent',
      description: 'A list of steps in natural language which are executed sequentially by an llm',
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  },
}
