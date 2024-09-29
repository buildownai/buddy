import { config } from '../config.js'
import { getNewLLM } from './getNewLLM.js'

/**
 * Create embeddings for a string or an array of strings
 * @param input - The input to get embeddings for
 * @returns The embeddings
 */
export const getEmbeddings = async <T extends string | string[]>(
  input: T
): Promise<T extends string ? number[] : number[][]> => {
  const llm = getNewLLM()
  const embeddings = await llm.embed({
    model: config.llm.models.embeddings,
    input,
    keep_alive: 60000,
  })
  return (
    typeof input === 'string' ? embeddings.embeddings[0] : embeddings.embeddings
  ) as T extends string ? number[] : number[][]
}
