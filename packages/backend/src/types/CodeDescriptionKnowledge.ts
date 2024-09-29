import type { KnowledgeType } from './KnowledgeType.js'

export type CodeDescriptionKnowledge = {
  kind: KnowledgeType.CODE_DESCRIPTION
  project: string
  file: string
  pageContent: string
  embedding: number[]
}
