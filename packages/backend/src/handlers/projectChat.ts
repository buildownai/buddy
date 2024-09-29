import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'
import logger from '../logger.js'
import { chatWithRepo } from '../ollama.js'
import { chatHistoryRepository } from '../repository/chatHistory.js'
import type { JWTPayload, SendSSEFunction } from '../types/index.js'
import { errorResponse } from './errorResponse.js'
import { protectProjectRouteMiddleware } from './protectProjectRouteMiddleware.js'

type Variables = { jwtPayload: JWTPayload }

const app = new OpenAPIHono<{ Variables: Variables }>()

app.use('*', protectProjectRouteMiddleware)

const chatRoute = createRoute({
  method: 'post',
  path: '/{projectId}/chat',
  security: [{ Bearer: [] }],
  description:
    'Conversational chat with the project agent. Send a message to the project chat and receive a response via SSE',
  tags: ['Project', 'AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().describe('The message to send'),
            conversationId: z
              .string()
              .optional()
              .describe(
                'The ID of the existing conversation, to continue or not set, to indicate the start of a new conversation'
              ),
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

app.openapi(chatRoute, async (c) => {
  const { projectId } = c.req.valid('param')
  let { message, conversationId } = c.req.valid('json')

  if (!conversationId) {
    conversationId = await chatHistoryRepository.startChatConversation(projectId)
  }

  logger.info({ projectId, conversationId }, 'Starting chat response generation')

  return streamSSE(
    c,
    async (stream) => {
      let id = 0

      const abort = new AbortController()

      stream.onAbort(() => {
        abort.abort()
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

        const responseGenerator = await chatWithRepo({
          projectId,
          conversationId: conversationId,
          sendSSE,
          content: message,
          abort,
        })

        const msg = {
          role: '',
          content: '',
        }

        for await (const token of responseGenerator) {
          await sendSSE('token', token.message.content.toString())
          msg.content += token.message.content.toString()
          msg.role = token.message.role
        }

        await sendSSE('end', 'Finished')
        await chatHistoryRepository.addMessageToConversation(conversationId, msg)
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

const chatHistoriesRoute = createRoute({
  method: 'get',
  path: '/{projectId}/chat/history',
  security: [{ Bearer: [] }],
  description: 'Gets the all conversational chats for current user and current project',
  tags: ['Project', 'AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
    }),
  },
  responses: {
    200: {
      description: 'List of all chat conversations in this project',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              id: z.string(),
              createdAt: z.string().datetime(),
              messages: z
                .array(
                  z
                    .object({
                      id: z.string(),
                      createdAt: z.string().datetime(),
                      role: z.string().describe('The role of the message producer'),
                      content: z.string().describe('The message content'),
                    })
                    .describe('A single message entry')
                )
                .describe('The list of chat messages'),
            })
          ),
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(chatHistoriesRoute, async (c) => {
  const { projectId } = c.req.valid('param')

  const conversations = await chatHistoryRepository.getConversations(projectId)

  return c.json(conversations, 200)
})

const chatHistoryRoute = createRoute({
  method: 'get',
  path: '/{projectId}/chat/history/{conversationId}',
  security: [{ Bearer: [] }],
  description: 'Gets the full single history of a conversational chat',
  tags: ['Project', 'AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
      conversationId: z
        .string()
        .describe('The ID of the conversation, if continuing an existing one'),
    }),
  },
  responses: {
    200: {
      description: 'The chat conversation',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            createdAt: z.string().datetime(),
            messages: z
              .array(
                z
                  .object({
                    id: z.string(),
                    createdAt: z.string().datetime(),
                    role: z.string().describe('The role of the message producer'),
                    content: z.string().describe('The message content'),
                  })
                  .describe('A single message entry')
              )
              .describe('The list of chat messages'),
          }),
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(chatHistoryRoute, async (c) => {
  const { conversationId } = c.req.valid('param')

  const conversation = await chatHistoryRepository.getConversationById(conversationId)

  if (!conversation) {
    return c.json({ error: 'Not Found' }, 404)
  }

  return c.json(conversation, 200)
})

const chatRecentConversationRoute = createRoute({
  method: 'get',
  path: '/{projectId}/chat',
  security: [{ Bearer: [] }],
  description: 'Gets the full single history of a conversational chat',
  tags: ['Project', 'AI-Chat'],
  request: {
    params: z.object({
      projectId: z.string().describe('The ID of the project'),
    }),
  },
  responses: {
    200: {
      description: 'The recent chat conversation',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            createdAt: z.string().datetime(),
            messages: z
              .array(
                z
                  .object({
                    id: z.string(),
                    createdAt: z.string().datetime(),
                    role: z.string().describe('The role of the message producer'),
                    content: z.string().describe('The message content'),
                  })
                  .describe('A single message entry')
              )
              .describe('The list of chat messages'),
          }),
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(chatRecentConversationRoute, async (c) => {
  const { projectId } = c.req.valid('param')

  const conversation = await chatHistoryRepository.getRecentConversation(projectId)

  if (!conversation) {
    logger.error('conversation not found')
    return c.json({ error: 'Not Found' }, 404)
  }

  return c.json(conversation, 200)
})

export { app as projectChat }
