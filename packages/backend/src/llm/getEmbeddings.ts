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
  const embeddings = await llm.embeddings.create(
    {
      model: config.llm.models.embeddings,
      input,
    },
    {}
  )
  return (
    typeof input === 'string'
      ? embeddings.data[0].embedding
      : embeddings.data.map((d) => d.embedding)
  ) as T extends string ? number[] : number[][]
}
