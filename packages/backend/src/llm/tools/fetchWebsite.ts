import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import logger from '../../logger'
import type { ToolEntry } from '../../types'
import { convertHtmlToMarkdown } from '../convertHtmlToMarkdown.js'
import { validateParams } from './toolHelper.js'

const paramSchema = z.object({
  url: z.string().url().describe('The URL of the webpage to fetch'),
})

function removeScriptAndStyleTagsWithRegex(html: string): string {
  // Remove <script> tags and their content
  const withoutScript = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove <style> tags and their content
  const withoutStyle = withoutScript.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  return withoutStyle
}

export const toolFetchWebpage: ToolEntry = {
  fn: async (input: unknown) => {
    try {
      const { url } = validateParams(paramSchema, input)
      const result = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (!result.ok) {
        logger.error({ url }, `Unable to fetch the webpage. Status code ${result.status}`)
        return `Unable to fetch the webpage. Status code ${result.status}`
      }

      const webpageContent = await result.text()

      return await convertHtmlToMarkdown(removeScriptAndStyleTagsWithRegex(webpageContent))
    } catch (err) {
      logger.error({ err, input }, 'Wrong input in tool call fetch_webpage')
      return 'Unable to fetch the webpage. Please check your URL'
    }
  },
  schema: {
    type: 'function',
    function: {
      name: 'fetch_webpage',
      description: 'Fetch the content of a webpage for given url',
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  },
}