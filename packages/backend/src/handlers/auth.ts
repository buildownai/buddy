import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { sign, verify } from 'hono/jwt'
import { config } from '../config.js'
import logger from '../logger.js'
import { userRepository } from '../repository/user.js'
import type { JWTPayload } from '../types/index.js'
import { errorResponse } from './errorResponse.js'

type Variables = { jwtPayload: JWTPayload }

const app = new OpenAPIHono<{ Variables: Variables }>()

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  description: 'Authenticate a user and receive access and refresh tokens',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().describe("User's email address"),
            password: z.string().describe("User's password"),
          }),
          example: {
            email: 'user@example.com',
            password: 'password123',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful authentication',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string().describe('JWT access token'),
            refreshToken: z.string().describe('JWT refresh token'),
          }),
          example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
    ...errorResponse,
  },
})

const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  description: 'Refresh an expired access token using a valid refresh token',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            refreshToken: z.string().describe('Valid JWT refresh token'),
          }),
          example: {
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully refreshed tokens',
      content: {
        'application/json': {
          schema: z.object({
            accessToken: z.string().describe('New JWT access token'),
            refreshToken: z.string().describe('New JWT refresh token'),
          }),
          example: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json')

  try {
    const user = await userRepository.getUserByEmailAndPassword(email, password)
    if (user) {
      const id = user.id

      const accessToken = await sign(
        { id, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
        config.jwtSecret,
        config.jwtAlgorithm
      )
      const jwtPayload: JWTPayload = { id }
      const refreshToken = await sign(jwtPayload, config.jwtSecret, config.jwtAlgorithm)

      return c.json({ accessToken, refreshToken }, 200)
    }

    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (err) {
    logger.error({ err }, 'db error')
    return c.json({ error: 'Internal server Error' }, 500)
  }
})

app.openapi(refreshRoute, async (c) => {
  const { refreshToken } = c.req.valid('json')

  try {
    const payload = await verify(refreshToken, config.jwtSecret, config.jwtAlgorithm)

    const newAccessToken = await sign(
      { id: payload.id, exp: Math.floor(Date.now() / 1000) + 60 * 5 },
      config.jwtSecret,
      config.jwtAlgorithm
    )
    const jwtPayload = { id: payload.id }
    const newRefreshToken = await sign(jwtPayload, config.jwtSecret, config.jwtAlgorithm)

    return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken }, 200)
  } catch (err) {
    logger.error({ err }, 'Failed to refresh token')
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

export { app as auth }
