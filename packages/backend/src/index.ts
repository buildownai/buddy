import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import { jwt } from 'hono/jwt'
import type { HTTPResponseError } from 'hono/types'
import { config } from './config.js'
import { connectDb, migrateDb } from './db.js'
import { auth } from './handlers/auth.js'
import { crawlRepository } from './handlers/crawlRepository/index.js'
import { healthCheck } from './handlers/healthCheck.js'
import { me } from './handlers/me.js'
import { projectChat } from './handlers/projectChat.js'
import { projectCodeGeneration } from './handlers/projectCodeGeneration.js'
import { projectFiles } from './handlers/projectFiles.js'
import { projects } from './handlers/projects.js' // Add this import
import logger from './logger.js'
import type { JWTPayload } from './types/index.js'

type Variables = { jwtPayload: JWTPayload }

const app = new OpenAPIHono<{ Variables: Variables }>()

// CORS middleware
app.use('*', async (c, next) => {
  await next()
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
})

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
})

// API documentation
app.doc31('/api/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'TS Wizard API',
    version: 'v1',
  },
  tags: [
    { name: 'Auth', description: 'Authorization endpoints. Login and refresh token endpoints' },
    {
      name: 'Project',
      description:
        'Handling of projects. It includes managing projects and interacting with a project',
    },
    {
      name: 'AI-Chat',
      description: 'Interacting with the project via the AI chat & completion endpoints',
    },
    {
      name: 'Files',
      description:
        'Interacting with the project file system. Create, delete and update files and folders of the project',
    },
    { name: 'User', description: 'Endpoints to handle user and their information' },
    {
      name: 'Internal',
      description: 'Technical endpoints like health, which are not part of the core functionality',
    },
  ],
})

// Serve API reference UI
app.get(
  '/api',
  apiReference({
    spec: {
      url: '/api/openapi.json',
    },
  })
)

app.route('/api/auth', auth)

app.use(
  '/api/v1/*',
  jwt({
    secret: config.jwtSecret,
    alg: config.jwtAlgorithm,
  })
)

app.route('/api/v1/projects', crawlRepository)
app.route('/api/v1/projects', projects)
app.route('/api/v1/projects', projectChat)
app.route('/api/v1/projects', projectCodeGeneration)
app.route('/api/v1/projects', projectFiles)
app.route('/api/v1', me)
app.route('/api/health', healthCheck)

// connect to db
try {
  await connectDb()
  await migrateDb()
} catch (err) {
  logger.error({ err }, 'Unable to connect to db')
  process.exit(1)
}

const port = config.port
logger.info(`Server is running on port ${port}`)
logger.info(`API Reference available at http://localhost:${port}/api`)

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

app.onError((err, c) => {
  logger.error({ err }, 'General error handler')
  const e = err as HTTPResponseError
  if (e.getResponse) {
    return e.getResponse()
  }

  return c.json('Custom Error Message', 500)
})

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 0,
}
