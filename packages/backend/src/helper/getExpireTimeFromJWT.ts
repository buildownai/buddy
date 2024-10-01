import logger from '../logger'

function decodeBase64Url(base64Url: string): string {
  // Replace base64url characters to base64
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

  // Decode base64 string to normal string
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join('')
  )
}

export const getExpireTimeFromJWT = (token: string): number => {
  try {
    // Split the JWT into its components
    const parts = token.split('.')

    if (parts.length !== 3) {
      throw new Error('Invalid JWT structure')
    }

    // The payload is the second part, decode it from base64url
    const payload = JSON.parse(decodeBase64Url(parts[1]))

    // Return the 'exp' claim if it exists
    return payload.exp ? payload.exp : null
  } catch (err) {
    logger.error({ err }, 'Invalid token')
    return 0
  }
}
