import { type UnknownKeysParam, type ZodRawShape, z } from 'zod'
import logger from '../../logger.js'

export const validateParams = <K extends ZodRawShape, V extends UnknownKeysParam>(
  schema: z.ZodObject<K, V>,
  input: unknown
) => {
  const s = schema.extend({
    projectId: z.string(),
  })

  const validation = s.safeParse(input)
  if (!validation.success) {
    logger.error({ input }, 'invalid input')
    throw {
      message: 'Invalid tool parameters provided',
      error: validation.error.message,
    }
  }
  return validation.data
}
