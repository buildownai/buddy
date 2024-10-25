import type { Message } from "ollama";
import { RecordId, Table } from "surrealdb";
import { getDb } from "../db.js";
import logger from "../logger.js";
import type { ChatConversation, Project } from "../types/index.js";

const chatMessageTable = new Table("chat_message");

type ConversationDb = {
  id: RecordId<"chat_conversation">;
  project: RecordId<"project">;
  summary: string;
  createdAt: Date;
};

type ChatMessageDb = {
  id: RecordId<"chat_message">;
  chatConversation: RecordId<"chat_conversation">;
  createdAt: Date;
  role: "system" | "user" | "assistant";
  content: string;
};

export const chatHistoryRepository = {
  startChatConversation: async (project: Project, systemPrompt?: string) => {
    const db = await getDb();
    const res = (await db.create("chat_conversation", {
      project: new RecordId("project", project.id),
    })) as [ConversationDb];

    logger.debug({ res }, "chat conversation created");

    return res[0].id.id as string;
  },
  getConversations: async (projectId: string) => {
    const db = await getDb();
    const result = await db.query<[ChatConversation[]]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    summary,
    (SELECT *
        FROM ONLY chat_message
        WHERE chatConversation = $parent.id AND role!="system"
        ORDER BY createdAt DESC LIMIT 1
    ).content ||"" as content
FROM chat_conversation
WHERE project=$projectId
ORDER BY createdAt DESC;`,
      { projectId: new RecordId("project", projectId) }
    );
    return result[0];
  },
  updateConversationSummary: async (
    conversationId: string,
    summary: string
  ) => {
    const db = await getDb();
    await db.merge(new RecordId("chat_conversation", conversationId), {
      summary,
    });
  },
  getRecentConversationMessages: async (conversationId: string, limit = 5) => {
    const db = await getDb();
    const result = await db.query<[ChatMessageDb[]]>(
      'SELECT * FROM chat_message WHERE (role="user" OR role="assistant") AND chatConversation=$conversation ORDER BY createdAt DESC LIMIT $limit',
      { conversation: new RecordId("chat_conversation", conversationId), limit }
    );
    return result[0] ?? [];
  },
  getFullConversationById: async (conversationId: string) => {
    const db = await getDb();

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    summary,
    (SELECT content, role, createdAt
        FROM chat_message
        WHERE chatConversation = $parent.id
        ORDER BY createdAt ASC
    ) as messages
FROM ONLY $conversation`,
      { conversation: new RecordId("chat_conversation", conversationId) }
    );
    return result[0];
  },
  getConversationById: async (conversationId: string) => {
    const db = await getDb();

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    summary,
    (SELECT content, role, createdAt
        FROM chat_message
        WHERE chatConversation = $parent.id AND role !='system'
        ORDER BY createdAt ASC
    ) as messages
FROM ONLY $conversation`,
      { conversation: new RecordId("chat_conversation", conversationId) }
    );
    return result[0];
  },
  getRecentConversation: async (projectId: string) => {
    const db = await getDb();

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    createdAt as lastUpdate,
    summary,
    chatConversation.createdAt as createdAt,
    record::id(chatConversation.id) as id,
    (SELECT content, role, createdAt FROM chat_message WHERE chat_conversation = $parendId AND role !='system' ORDER BY createdAt ASC) as messages
        FROM ONLY chat_message
        WHERE chatConversation.project=$projectId
        ORDER BY createdAt DESC LIMIT 1 FETCH chatConversation`,
      { projectId: new RecordId("project", projectId) }
    );
    return result[0];
  },
  addMessageToConversation: async (
    conversationId: string,
    message: Message | Message[]
  ) => {
    const db = await getDb();
    const transfromToDbSchema = (
      m: Message
    ): Omit<ChatMessageDb, "id" | "createdAt"> => {
      return {
        ...m,
        chatConversation: new RecordId("chat_conversation", conversationId),
      };
    };
    const input = Array.isArray(message)
      ? message.map(transfromToDbSchema)
      : transfromToDbSchema(message);

    await db.insert(chatMessageTable, input);
  },
};
