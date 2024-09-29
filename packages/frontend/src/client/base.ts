import router from '../router/index.js'
import { useAuth } from '../store/index.js'
import type { AuthTokens } from './types.js'

const API_URL = '/api'

export class BaseApi {
  private static refreshPromise: Promise<AuthTokens> | null = null

  protected static async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${endpoint}`
    const { getTokens, clearTokens } = useAuth()
    const tokens = getTokens()

    if (tokens) {
      options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      }
    }

    let response = await fetch(url, options)

    if (response.status === 401 && tokens) {
      const newTokens = await BaseApi.refreshToken(tokens.refreshToken)
      if (newTokens) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        }
        response = await fetch(url, options)
      } else {
        clearTokens()
        router.push({ name: 'Login' })
        throw new Error('Authentication failed')
      }
    }

    if (!response.ok) {
      const error: any = new Error('API request failed')
      error.status = response.status
      throw error
    }

    return response
  }

  private static async refreshToken(refreshToken: string): Promise<AuthTokens | null> {
    if (!BaseApi.refreshPromise) {
      const { saveTokens } = useAuth()
      BaseApi.refreshPromise = fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then(async (response) => {
          if (response.ok) {
            const tokens = await response.json()
            saveTokens(tokens)
            return tokens
          }
          return null
        })
        .finally(() => {
          BaseApi.refreshPromise = null
        })
    }
    return BaseApi.refreshPromise
  }

  static async refreshTokens() {
    const { getTokens } = useAuth()
    const tokens = getTokens()
    if (!tokens?.refreshToken) {
      throw new Error('New Authentication required')
    }
    return await BaseApi.refreshToken(tokens.refreshToken)
  }
}
