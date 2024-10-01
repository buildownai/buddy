export type BaseKnowledgeType = {
  id: string
  project: string
  file: string
  pageContent: string
  embedding: number[]
  createdAt: Date
  updatedAt: Date
}
