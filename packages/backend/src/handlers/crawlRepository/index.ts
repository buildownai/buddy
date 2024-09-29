import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { streamSSE } from 'hono/streaming'

import { config } from '../../config.js'
import { generateSystemPromptContext } from '../../llm/generateSystemPromptContext.js'
import { pullModel } from '../../llm/ollama.js'
import logger from '../../logger.js'
import { projectRepository } from '../../repository/project.js'
import type { SSEMessage, SendProgress } from '../../types/index.js'
import { errorResponse } from '../errorResponse.js'
import { cloneRepo } from './cloneRepo.js'
import { fetchDependencyTypes } from './fetchDependencyTypes.js'
import { indexRepo } from './indexRepo.js'

const app = new OpenAPIHono()

const sseMessageSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('info'),
    message: z.string().describe('Information message'),
    totalSteps: z.number().describe('Total number of steps in the analysis process'),
    steps: z.array(z.string()).describe('Array of step names'),
  }),
  z.object({
    event: z.literal('progress'),
    message: z.string().describe('Progress update message'),
    progress: z.number().describe('Progress percentage'),
    step: z.string().describe('Current step of the analysis'),
  }),
  z.object({
    event: z.literal('complete'),
    message: z.string().describe('Completion message'),
    projectId: z.string().describe('ID of the analyzed project'),
  }),
  z.object({
    event: z.literal('error'),
    message: z.string().describe('Error message'),
  }),
])

const crawlRoute = createRoute({
  method: 'post',
  path: '/',
  security: [{ Bearer: [] }],
  tags: ['Project'],
  description:
    'Clone a Git repository and analyze its contents. This endpoint uses Server-Sent Events (SSE) to stream progress updates.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            repoUrl: z
              .string()
              .url()
              .describe('The URL of the Git repository to clone and analyze'),
          }),
          example: {
            repoUrl: 'https://github.com/example/repo.git',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful response with SSE stream',
      content: {
        'text/event-stream': {
          schema: sseMessageSchema,
          example: {
            message: 'git.clone receiving objects stage 50% complete',
            event: 'progress',
            id: '1',
          },
        },
      },
    },
    400: {
      description: 'Bad request - invalid input',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string().describe('Error message describing the issue'),
          }),
          example: {
            error: 'Invalid repository URL provided',
          },
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(crawlRoute, async (c) => {
  const { repoUrl } = c.req.valid('json')
  const { id: userId } = c.get('jwtPayload')

  logger.info({ repoUrl }, 'Starting repository crawl')

  return streamSSE(c, async (stream) => {
    let id = 0
    try {
      const sendProgress: SendProgress = async (message: string, progress = 0, step = '') => {
        const msg: SSEMessage = { message, progress, event: 'progress', step }
        await stream.writeSSE({
          data: JSON.stringify(msg),
          event: 'progress',
          id: String(id++),
        })
      }

      // Send initial info event
      const infoMsg: SSEMessage = {
        event: 'info',
        message: 'Starting repository analysis',
        totalSteps: 4,
        steps: [
          'Clone repository',
          'Pull main model',
          'Pull embedding model',
          'Fetch typescript typings',
          'Index repository',
        ],
      }
      await stream.writeSSE({
        data: JSON.stringify(infoMsg),
        event: 'info',
        id: String(id++),
      })

      // Step 1: Clone repository
      await sendProgress('Cloning repository...', 0, 'Clone repository')
      const { clonePath,projectId } = await cloneRepo(userId, repoUrl, (message, progress) =>
        sendProgress(message, progress, 'Clone repository')
      )
      await sendProgress('Repository cloned successfully', 100, 'Clone repository')

      // Step 2: Pull main model
      await sendProgress('Pulling main model...', 0, 'Pull main model')
      await pullModel(config.llm.models.chat, (message, progress) =>
        sendProgress(message, progress, 'Pull main model')
      )
      await sendProgress('Main model pulled successfully', 100, 'Pull main model')

      // Step 3: Pull coding model
      await sendProgress('Pulling main model...', 0, 'Pull coding model')
      await pullModel(config.llm.models.code, (message, progress) =>
        sendProgress(message, progress, 'Pull coding model')
      )
      await sendProgress('Main model pulled successfully', 100, 'Pull main model')

      // Step 4: Pull embedding model
      await sendProgress('Pulling embedding model...', 0, 'Pull embedding model')
      await pullModel(config.llm.models.embeddings, (message, progress) =>
        sendProgress(message, progress, 'Pull embedding model')
      )
      await sendProgress('Embedding model pulled successfully', 100, 'Pull embedding model')

      // Step 5: Pull get project settings
      await sendProgress('Generating project description...', 0, 'Project description')
      const description = await generateSystemPromptContext(clonePath);
      await projectRepository.updateProject(projectId,{description})
      await sendProgress('Project description generated', 100, 'Project description')

      // Step 6: Fetch typescript typings
      await sendProgress('Fetching typescript types...', 0, 'Fetch typescript typings')
      await fetchDependencyTypes(clonePath, (message, progress) =>
        sendProgress(message, progress, 'Fetch typescript typings')
      )
      await sendProgress('Typescript types fetched successfully', 100, 'Fetch typescript typings')

      // Step 7: Index repository
      await sendProgress('Indexing repository...', 0, 'Index repository')
      await indexRepo(clonePath, (message, progress) =>
        sendProgress(message, progress, 'Index repository')
      )
      await sendProgress('Repository indexed successfully', 100, 'Index repository')

      // Analysis complete
      const completeMsg: SSEMessage = { event: 'complete', message: 'Analysis complete', projectId }
      await stream.writeSSE({
        data: JSON.stringify(completeMsg),
        event: 'complete',
        id: String(id++),
      })
    } catch (error) {
      logger.error({ error }, 'An error occurred during repository crawling')

      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = 'An unknown error occurred'
      }

      const errorMsg: SSEMessage = { event: 'error', message: errorMessage }
      await stream.writeSSE({
        data: JSON.stringify(errorMsg),
        event: 'error',
        id: String(id++),
      })
    } finally {
      stream.close()
    }
  })
})

export { app as crawlRepository }
