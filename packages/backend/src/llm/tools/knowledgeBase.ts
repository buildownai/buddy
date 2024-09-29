import { RecordId } from 'surrealdb'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { getDb } from '../../db.js'
import { generateAnswer, getEmbeddings } from '../../llm/index.js'
import logger from '../../logger'
import type { Knowledge, ToolEntry } from '../../types/index.js'
import { validateParams } from './toolHelper.js'

const paramSchema = z.object({
  question: z.string().describe('Question about which context information is needed'),
})

export const knowledgeBase: ToolEntry = {
  fn: async (input: unknown) => {
    try {
      const { projectId, question } = validateParams(paramSchema, input)
      const embedding = await getEmbeddings(`search_query: ${question}`)
      const db = await getDb()

      const result = await db.query<[Knowledge[]]>(
        `SELECT similarity, pageContent, file,
  vector::similarity::cosine(embedding, $embedding) as similarity
  FROM knowledge
  WHERE project=$project AND vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
  ORDER BY similarity desc LIMIT $maxResults;`,
        {
          maxResults: 5,
          scoreThreshold: 0.5,
          embedding: embedding,
          project: new RecordId('project', projectId),
        }
      )

      logger.debug({ count: result.length }, 'Knowledgebase result')

      const context = result[0]
        .map((res) => `## Source file ${res.file}\n${res.pageContent}`)
        .join('\n')
      const answer = await generateAnswer(`Extract and provide the information to answer the question.

Question:
${question}

Context:

${context}
`)

      return answer
    } catch (err) {
      logger.error({ err, input }, 'Wrong input in tool call knowledge_base')
      return 'Error: Sorry, but unable to find the information'
    }
  },
  schema: {
    type: 'function',
    function: {
      name: 'get_context',
      description: 'Enhance the context with relevant or missing information',
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  },
}
