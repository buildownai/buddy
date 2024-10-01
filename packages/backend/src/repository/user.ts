import { RecordId, Table } from 'surrealdb'
import { getDb } from '../db'
import logger from '../logger'

export type UserDb = {
  id: RecordId
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export const userTable = new Table('user')

export const userRepository = {
  getUserByEmailAndPassword: async (email: string, password: string) => {
    try {
      const db = await getDb()
      const result = await db.query<[UserDb]>(
        'SELECT id, name, email, created FROM ONLY user WHERE email = string::lowercase($email) AND crypto::argon2::compare(password,$password) LIMIT 1',
        { email: email.toLowerCase().trim(), password: password.trim() }
      )

      if (!result[0]) {
        logger.debug({ result }, 'No entry found for given user & password')
        return undefined
      }

      return { ...result[0], id: result[0].id.id as string }
    } catch (err) {
      logger.error({ err }, 'Failed to login')
    }
  },
  getUserById: async (id: string) => {
    const db = await getDb()
    const result = await db.select<UserDb>(new RecordId(userTable.tb, id))

    if (!result) {
      return undefined
    }

    return { ...result, id: result.id.id as string }
  },
}
