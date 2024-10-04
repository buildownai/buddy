import { config } from '../config.js'
import { llmDefaultOptions } from '../defaults/llmDefaultOptions.js'
import { getNewLLM } from './getNewLLM.js'

export const convertHtmlToMarkdown = async (content: string) => {
  const llm = getNewLLM()

  const response = await llm.chat.completions.create({
    model: config.llm.models.html,
    messages: [
      {
        role: 'system',
        content:
          'Convert the content into a markdown format without any further explanation or suggestion. Include links and images if possible. Ensure valid full urls and links',
      },
      { role: 'user', content },
    ],
    stream: false,
    ...llmDefaultOptions,
  })

  return response.choices[0]?.message?.content ?? ''
}
