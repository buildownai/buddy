import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

export const generateAnswer = async (content: string) => {
  const llm = getNewLLM()

  const response = await llm.generate({
    model: config.llm.models.chat,
    prompt: content,
    system: 'Your are an AI which provides information to answer the users question',
    stream: false,
    options: {
      temperature: 0,
    },
  })

  return response.response
}
