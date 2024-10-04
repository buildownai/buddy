import type { Message } from "ollama";
import { RecordId, Table } from "surrealdb";
import { getDb } from "../db.js";
import logger from "../logger.js";
import type { ChatConversation } from "../types/index.js";
import { projectRepository } from "./project.js";

const defaultSystemMessageContent = `You are a helpful AI assistant named Pilot who can use tools.
You help the user to work on his typescript project.

## Project information and context

You are already in the project folder and the project folder is the root /.
Always use tools to find facts end to ensure correct responses.
When you create a response, based on tool calls, you can again call tools to improve your answer.
You can call tools as often as you need to provide the answer.
Files and the folders might have changed between your responses. You must always ensure, that your answer is based on the most recent file content and folder structure.

## Instructions

- The user question is always related to the project and to the files of the project.
- Follow exactly the users instructions
- Use tools to extract your context and information
- Before answering a users, always make a planning and reasoning. Put Your plan, thoughts and reasoning into the tag <Thoughts></Thoughts> and than provide the regular answer
- If possible, read files and show it to the user
- You have access the files of the project with tools
- You have access to the web with tools
- You have access to the knowledge base which provides you more context with tools
- Answer the users questions short, correct and precise
- Your answer must base on actual file content
- Always read the file content before you answer
- When you return suggestions for file changes, you always must retrun the complete file content
- Shortening of file content is never permitted
- Check and validate your answer with tool calls
- If you can not find an aswer, tell the user that you can not provide an answer

## Tools

- You can access files of the project with tools
- You can fetch the content of urls with the tool fetch_webpage
- You can get more detailed information about dependency packages with the tool getNpmPackageInfo. Do not use it to find information about the project itself.
- For complex requests, use step_agent tool
- Before you can write a file, you need to read the current file content, and apply the changes on the full file content. You need to write the full file content. IT IS NOT ALLOWED TO LOOSE INFORMATION!

## Format

Alway use markdown for responses.
If you show code snippets in markdown, try to add the file path like this

\`\`\`typescript [/MyComponent.ts]
// the code goes here
\`\`\`

Follow the instructions and always use the tools to get context, and return the the answer in the defined format.
`;

const chatConversationTable = new Table("chat_conversation");

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
  role: string;
  content: string;
};

export const chatHistoryRepository = {
  startChatConversation: async (projectId: string, systemPrompt?: string) => {
    const db = await getDb();
    const res = (await db.create("chat_conversation", {
      project: new RecordId("project", projectId),
    })) as [ConversationDb];

    const project = await projectRepository.getProjectById(projectId);

    logger.debug({ res }, "chat conversation created");

    const systemMessage: Omit<ChatMessageDb, "id" | "createdAt"> = {
      role: "system",
      content:
        systemPrompt ??
        `${defaultSystemMessageContent}\n## Project information\n${
          project?.description ?? ""
        }`,
      chatConversation: res[0].id,
    };

    await db.create("chat_message", systemMessage);

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
