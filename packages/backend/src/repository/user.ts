import { RecordId, Table } from 'surrealdb'
import { getDb } from '../db'
import logger from '../logger'

export type User = {
  id: RecordId
  email: string
  name: string
  created: string
}

export const userTable = new Table('user')

export const userRepository = {
  getUserByEmailAndPassword: async (email: string, password: string) => {
    try {
      const db = await getDb()
      const result = await db.query<User[]>(
        'SELECT id, name, email, created FROM ONLY user WHERE email = $email AND crypto::argon2::compare(password,$password) LIMIT 1',
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
    const result = (await db.select<User>(new RecordId(userTable.tb, id))) as unknown as User

    if (!result) {
      return undefined
    }

    return { ...result, id: result.id.id as string }
  },
}
