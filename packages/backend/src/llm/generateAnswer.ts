import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

export const generateAnswer = async (content: string) => {
  const llm = getNewLLM()

  const response = await llm.generate({
    model: config.llm.models.chat,
    prompt: content,
    system: `
    You are an AI which should answer to a search query or question, only based on the given context.
    If the context does not contain the required information and facts to provide the answer, you must only return the word FAIL without any further explanation`,
    stream: false,
    options: {
      temperature: 0,
      top_k: 40,
      top_p: 0.95,
      repeat_penalty: 1.1,
    },
  })

  return response.response
}
