import { BaseApi } from './base.js'
import type { User } from './types.js'

export class MeApi extends BaseApi {
  static async getCurrentUser(): Promise<User> {
    const response = await MeApi.fetch('/v1/me')
    return response.json()
  }
}
