import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

export const convertHtmlToMarkdown = async (content: string) => {
  const llm = getNewLLM()

  const response = await llm.generate({
    model: config.llm.models.html,
    prompt: content,
    system:
      'Convert the content into a markdown format without any further explanation or suggestion. Include links and images if possible. Ensure valid full urls and links',
    stream: false,
    options: {
      temperature: 0,
    },
  })

  return response.response
}
