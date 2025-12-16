import { isAxiosError } from 'axios'

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function formatError(error: unknown): string {
  // Handle Error objects with message
  if (error instanceof Error) {
    return `❌ ${error.message}`
  }

  // Handle Axios errors
  if (isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // Try to extract meaningful error message
      if (typeof data === 'object' && data !== null) {
        if ('error' in data && typeof data.error === 'object' && data.error !== null && 'message' in data.error) {
          return `❌ HTTP ${status}: ${data.error.message}`
        }
        if ('message' in data) {
          return `❌ HTTP ${status}: ${data.message}`
        }
      }

      return `❌ HTTP ${status}: ${JSON.stringify(data)}`
    }

    if (error.request) {
      return `❌ Network error: ${error.message || 'No response from server'}`
    }

    return `❌ Request error: ${error.message}`
  }

  // Fallback for other types of errors
  return `❌ ${JSON.stringify(error)}`
}
