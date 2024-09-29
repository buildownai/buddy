import { type RecordId, Table } from 'surrealdb'
import { getDb } from '../db.js'
import { getEmbeddings } from '../llm/getEmbeddings.js'
import logger from '../logger.js'
import type { Knowledge, KnowledgeType } from '../types/index.js'

const knowledgeTable = new Table('knowledge')

type KnowledgeDb = {
  id: RecordId<'knowledge'>
}

type CodeDescriptionKnowledgeDb = {
  kind: KnowledgeType.CODE_DESCRIPTION
  project: RecordId<'project'>
  file: string
  pageContent: string
  embedding: number[]
}

export const knowledgeRepository = {
  addKnowledge: async (knowledge: CodeDescriptionKnowledgeDb) => {
    try {
      const db = await getDb()
      await db.insert(knowledgeTable, knowledge)
    } catch (err) {
      logger.error({ err, knowledge }, 'Failed to write knowledge')
    }
  },
  findKnowledge: async (question: string, maxResults = 5, scoreThreshold = 0.5) => {
    try {
      const embedding = await getEmbeddings(question)
      const db = await getDb()
      const result = await db.query<[Knowledge[]]>(
        `
SELECT
  id,
  pageContent, 
  metadata, 
  file,
  kind,
  vector::similarity::cosine(embedding, $embedding) as similarity
FROM knowledge
WHERE vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
ORDER BY similarity desc LIMIT $maxResults;`,
        {
          embedding,
          maxResults,
          scoreThreshold,
        }
      )

      return result[0]
    } catch (err) {
      logger.error({ err, question }, 'Failed to fetch knowledge')
    }
  },
}
