import type { BaseKnowledgeType } from './BaseKnowledgeType.js'
import type { KnowledgeType } from './KnowledgeType.js'

export type CodeDescriptionKnowledge = BaseKnowledgeType & {
  kind: KnowledgeType.CODE_DESCRIPTION
  branch: string
}
