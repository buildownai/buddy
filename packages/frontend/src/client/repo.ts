import { BaseApi } from './base.js'

export interface AnalysisEvent {
  event: 'progress' | 'complete' | 'error'
  message: string
  progress?: number
}

export interface ChatEvent {
  event: 'start' | 'token' | 'end' | 'error'
  data: string
}

export class RepoApi extends BaseApi {
  static async *analyzeRepo(
    repositoryUrl: string,
    name: string
  ): AsyncGenerator<AnalysisEvent, void, unknown> {
    const response = await RepoApi.fetch('/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repositoryUrl, name }),
    })

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const eventData = JSON.parse(line.slice(6)) as AnalysisEvent
          yield eventData
        }
      }
    }
  }
}
