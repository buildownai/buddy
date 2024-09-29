import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { userRepository } from '../repository/user.js'
import type { JWTPayload } from '../types/index.js'
import { errorResponse } from './errorResponse.js'

type Variables = { jwtPayload: JWTPayload }

const app = new OpenAPIHono<{ Variables: Variables }>()

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  description: 'Get current user information',
  security: [{ bearerAuth: [] }],
  tags: ['User'],
  responses: {
    200: {
      description: 'Successful response with user information',
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email().describe("User's email address"),
            name: z.string().describe('The users name'),
            created: z.string().datetime().describe('Creation date of the user'),
          }),
          example: {
            name: 'John Doe',
            email: 'user@example.com',
          },
        },
      },
    },
    ...errorResponse,
  },
})

app.openapi(meRoute, async (c) => {
  const { id } = c.get('jwtPayload')

  const user = await userRepository.getUserById(id)

  if (!user) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  return c.json(user, 200)
})

export { app as me }
