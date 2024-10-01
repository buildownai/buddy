import { RecordId, Table } from "surrealdb";
import { getDb } from "../db.js";
import { getEmbeddings } from "../llm/getEmbeddings.js";
import logger from "../logger.js";
import { type Knowledge, KnowledgeType } from "../types/index.js";

const knowledgeTable = new Table("knowledge");

type BaseKnowledgeTypeDb = {
  project: RecordId<"project">;
  file: string;
  pageContent: string;
  embedding: number[];
};

type CodeDescriptionKnowledgeDb = BaseKnowledgeTypeDb & {
  kind: KnowledgeType.CODE_DESCRIPTION;
  branch: string;
};

type CodeDescriptionKnowledgeReadDb = CodeDescriptionKnowledgeDb & {
  id: RecordId<"knowledge">;
};

export const knowledgeRepository = {
  addCodeKnowledge: async (
    projectId: string,
    file: string,
    pageContent: string,
    branch = "main"
  ) => {
    try {
      const embedding = await getEmbeddings(`search_document: ${pageContent}`);
      const db = await getDb();

      const k: CodeDescriptionKnowledgeDb = {
        kind: KnowledgeType.CODE_DESCRIPTION,
        file,
        pageContent,
        embedding,
        project: new RecordId("project", projectId),
        branch,
      };

      const existing = await db.query<[CodeDescriptionKnowledgeReadDb[]]>(
        "SELECT id FROM knowledge WHERE kind=$kind AND file=$file AND branch=$banch",
        { kind: KnowledgeType.CODE_DESCRIPTION, file, branch }
      );

      if (existing[0].length) {
        await db.merge(existing[0][0].id, k);
        return existing[0][0].id.id;
      }

      const res = await db.insert<CodeDescriptionKnowledgeDb>(
        knowledgeTable,
        k
      );
      return res[0].id.id;
    } catch (err) {
      logger.error({ err, file }, "Failed to write code knowledge");
    }
  },
  removeCodeKnowledge: async (
    projectId: string,
    file: string,
    branch = "main"
  ) => {
    const db = await getDb();
    await db.query(
      "DELETE knowledge WHERE project=$project AND kind=$kind AND file=string::lowercase($file) AND branch=$branch",
      {
        file,
        projectId: new RecordId("project", projectId),
        kind: KnowledgeType.CODE_DESCRIPTION,
        branch,
      }
    );
  },
  findKnowledge: async (
    projectId: string,
    question: string,
    branch = "main",
    maxResults = 5,
    scoreThreshold = 0.5
  ): Promise<Knowledge[]> => {
    try {
      const embedding = await getEmbeddings(`search_query: ${question}`);
      const db = await getDb();
      const result = await db.query<[Knowledge[]]>(
        `SELECT similarity, pageContent, file,
  vector::similarity::cosine(embedding, $embedding) as similarity
  FROM knowledge
  WHERE project=$project AND vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
  ORDER BY similarity desc LIMIT $maxResults;`,
        {
          maxResults,
          scoreThreshold,
          embedding: embedding,
          project: new RecordId("project", projectId),
        }
      );
      return result[0] ?? [];
    } catch (err) {
      logger.error({ err, question }, "Failed to fetch knowledge");
      return [];
    }
  },
};
