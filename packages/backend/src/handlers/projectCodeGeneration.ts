import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import { fillInTheMiddleCode } from '../llm/index.js'
import logger from '../logger.js'
import { generateCode } from '../ollama.js'
import type { JWTPayload, SendSSEFunction } from '../types/index.js'
import { errorResponse } from './errorResponse.js'
import { protectProjectRouteMiddleware } from './protectProjectRouteMiddleware.js'

type Variables = { jwtPayload: JWTPayload }

const app = new OpenAPIHono<{ Variables: Variables }>()

app.use('*', protectProjectRouteMiddleware)

const fillInTheMiddleCodeRoute = createRoute({
  method: 'post',
  path: '/{projectId}/fill-middle-code',
  security: [{ Bearer: [] }],
  description: 'One time shoot for fill in the middle (autocomplete) tasks',
  tags: ['AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().describe('The message to send'),
            suffix: z.string().describe('TThe optional suffix for fill in the middle'),
            language: z.string().describe('The language hint'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'FIM code compleetion suggestion',
      content: {
        'text/plain': {
          schema: z.string(),
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(fillInTheMiddleCodeRoute, async (c) => {
  const { projectId } = c.req.valid('param')
  const { message, suffix, language } = c.req.valid('json')

  logger.info({ projectId }, 'Starting fill in the middle generation')

  const response = await fillInTheMiddleCode(projectId, message, suffix, language)

  logger.debug({ response }, 'fill in the middle response')

  return c.text(response, 200)
})

const generateCodeRoute = createRoute({
  method: 'post',
  path: '/{projectId}/generate-code',
  security: [{ Bearer: [] }],
  description:
    'One time shoot for generating code or fill in the middle (autocomplete) tasks. Send a message to the project generate and receive a response via SSE',
  tags: ['AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().describe('The message to send'),
            suffix: z.string().optional().describe('TThe optional suffix for fill in the middle'),
            conversationId: z
              .string()
              .optional()
              .describe('The ID of the conversation, if continuing an existing one'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful response with SSE stream',
      content: {
        'text/event-stream': {
          schema: z.object({
            event: z.enum(['start', 'token', 'end', 'error']),
            data: z.string(),
          }),
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(generateCodeRoute, async (c) => {
  const { projectId } = c.req.valid('param')
  const { message, conversationId, suffix } = c.req.valid('json')

  logger.info({ projectId, conversationId }, 'Starting code generation')

  return streamSSE(
    c,
    async (stream) => {
      let id = 0

      stream.onAbort(() => {
        logger.debug('SSE stream aborted!')
      })

      const sendSSE: SendSSEFunction = async (event, content) =>
        stream.writeSSE({
          data: JSON.stringify({ event, content }),
          event,
          id: String(id++),
        })

      try {
        await sendSSE('start', 'Thinking...')

        const responseGenerator = await generateCode(
          projectId,
          conversationId ?? '1',
          message,
          suffix
        )

        for await (const token of responseGenerator) {
          await sendSSE('token', token.response)
        }

        await sendSSE('end', 'Finished')
      } catch (error) {
        logger.error({ error, projectId, conversationId }, 'Error during chat response generation')
        await sendSSE('error', error instanceof Error ? error.message : 'An unknown error occurred')
      }
    },
    async (err, stream) => {
      logger.error({ err }, 'Error in SSE stream')
      await stream.close()
    }
  ) as any
})

export { app as projectCodeGeneration }
