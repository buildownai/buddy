import { z } from 'zod'

export const errorResponse = {
  401: {
    description: 'Authentication failed',
    content: {
      'application/json': {
        schema: z.object({
          error: z.string().describe('Error message'),
        }),
        example: {
          error: 'Invalid credentials',
        },
      },
    },
  },
  403: {
    description: 'Unauthorized access',
    content: {
      'application/json': {
        schema: z.object({
          error: z.string().describe('Error message'),
        }),
        example: {
          error: 'Unauthorized',
        },
      },
    },
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: z.object({
          error: z.string().describe('Error message'),
        }),
        example: {
          error: 'Not Found',
        },
      },
    },
  },
  498: {
    description: 'Token expired',
    content: {
      'application/json': {
        schema: z.object({
          error: z.string().describe('Error message'),
        }),
        example: {
          error: 'Token has expired',
        },
      },
    },
  },
}
