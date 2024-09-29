import { useAuth } from '../store/index.js'
import { BaseApi } from './base.js'
import type { AuthTokens, User } from './types.js'

export class AuthApi extends BaseApi {
  static async login(email: string, password: string): Promise<AuthTokens> {
    const { saveTokens } = useAuth()
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      throw new Error('Invalid credentials')
    }
    const tokens = await response.json()
    saveTokens(tokens)
    return tokens
  }

  static async getCurrentUser(): Promise<User> {
    const response = await AuthApi.fetch('/v1/me')
    return response.json()
  }

  static async logout(): Promise<void> {
    const { clearTokens } = useAuth()
    clearTokens()
  }
}
