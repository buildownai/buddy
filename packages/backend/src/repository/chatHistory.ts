import type { Message } from 'ollama'
import { RecordId, Table } from 'surrealdb'
import { getDb } from '../db.js'
import type { ChatConversation } from '../types/index.js'
import { projectRepository } from './project.js'

const defaultSystemMessageContent_old = `You are a helpful AI assistant named Wizard who can use tools.
You help the user to work on a typescript project.
You are already in the project folder. The project folder is root /.
The package.json is placed in ./package.json. The package.json includes the relevant information for this project.
Expect, that the questions are related to the project and the files of the project.
You can access the files of the project with tools.
If the question is related to the current project, try to use information from local files.
You can fetch information from external sources like npm or webpages with tools.

Before answering a users, make a planning and reasoning. Put Your thoughts into the tag <Thoughts></Thoughts>.
Try to request all information from user.
Use the tool get_context to get relevant and up to date information, before answering questions.
You can use the step_agent tool function for complex processes.

You can read files of the project and you are allowed to show the file content to the user.
Use and show file content to improve your answers.

If you show code snippets in markdown, try to add the file path like this

\`\`\`typescript [src/components/MyComponent.vue]
// the code goes here
\`\`\`

Your task is:
- to follow exactly the users instruction
- answer the users questions short, correct and precise in pretty markdown format
- use tool results to extract the required information an to create the answer
- help the user to solve problems and provide the user instructions on how to solve problems
- if possible, show the user code
`

const defaultSystemMessageContent = `You are a helpful AI assistant named Wizard who can use tools.
You help the user to work on his typescript project.

## Project information and context

You are already in the project folder and the project folder is the root /.
The project has a package.json file at \`/package.json\`, which you should always access with tool \`read_file\`.
The project files are indexed and you can use the tool \`get_context\` to search the index for information.
Use the tools \`get_context\` and \`read_file\` to get project information.

## Instructions

- The user question is always related to the project and to the files of the project.
- Follow exactly the users instructions
- Use tools to extract your context and information
- Before answering a users, always make a planning and reasoning. Put Your plan, thoughts and reasoning into the tag <Thoughts></Thoughts> and than provide the regular answer
- If possible, show the user code
- You have access the files of the project with tools
- You have access to the web with tools
- You have access to the knowledge base which provides you more context with tools
- Answer the users questions short, correct and precise
- Use the tool \`read_file\` to read the file \`package.json\`
- Use the tool \`read_file\` to get the content of a file
- Use the tool \`read_directory\` to get the list of files and sub folders of a directory
- Always use the tool \`get_context\` to get the context for your answer


## Tools

- You can access files of the project with tools
- You can fetch the content of urls with the tool fetch_webpage
- You can get more detailed information about dependency packages with the tool getNpmPackageInfo. Do not use it to find information about the project itself.
- For complex requests, use step_agent tool
- Before you can write a file, you need to read the current file content, and apply the changes on the full file content. You need to write the full file content. IT IS NOT ALLOWED TO LOOSE INFORMATION!

## Format

Use markdown for responses.
If you show code snippets in markdown, try to add the file path like this

\`\`\`typescript [src/components/MyComponent.vue]
// the code goes here
\`\`\`

Follow the instructions and always use the tools to get context, and return the the answer in the defined format.
`

const chatConversationTable = new Table('chat_conversation')

const chatMessageTable = new Table('chat_message')

type ConversationDb = {
  id: RecordId<'chat_conversation'>
  project: RecordId<'project'>
  createdAt: Date
}

type ChatMessageDb = {
  id: RecordId<'chat_message'>
  chatConversation: RecordId<'chat_conversation'>
  createdAt: Date
  role: string
  content: string
}

export const chatHistoryRepository = {
  startChatConversation: async (projectId: string, systemPrompt?: string) => {
    const db = await getDb()
    const res = (await db.create(chatConversationTable, {
      project: new RecordId('project', projectId),
    })) as unknown as ConversationDb

    const project = await projectRepository.getProjectById(projectId)

    const systemMessage: Omit<ChatMessageDb, 'id' | 'createdAt'> = {
      role: 'system',
      content: systemPrompt ?? `${defaultSystemMessageContent}\n## Project information\n${project?.description??''}`,
      chatConversation: res.id,
    }

    await db.create('chat_message', systemMessage)

    return res.id.id as string
  },
  getConversations: async (projectId: string) => {
    const db = await getDb()
    const result = await db.query<[ChatConversation[]]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    (SELECT *
        FROM ONLY chat_message
        WHERE chatConversation = $parent.id AND role!="system"
        ORDER BY createdAt DESC LIMIT 1
    ).content ||"" as content
FROM chat_conversation
WHERE project=$projectId
ORDER BY createdAt DESC;`,
      { projectId: new RecordId('project', projectId) }
    )
    return result[0]
  },
  getFullConversationById: async (conversationId: string) => {
    const db = await getDb()

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    (SELECT content, role, createdAt
        FROM chat_message
        WHERE chatConversation = $parent.id
        ORDER BY createdAt ASC
    ) as messages
FROM ONLY $conversation`,
      { conversation: new RecordId('chat_conversation', conversationId) }
    )
    return result[0]
  },
  getConversationById: async (conversationId: string) => {
    const db = await getDb()

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    record::id(id) as id,
    createdAt,
    (SELECT content, role, createdAt
        FROM chat_message
        WHERE chatConversation = $parent.id AND role !='system'
        ORDER BY createdAt ASC
    ) as messages
FROM ONLY $conversation`,
      { conversation: new RecordId('chat_conversation', conversationId) }
    )
    return result[0]
  },
  getRecentConversation: async (projectId: string) => {
    const db = await getDb()

    const result = await db.query<[ChatConversation | undefined]>(
      `SELECT
    createdAt as lastUpdate,
    chatConversation.createdAt as createdAt,
    record::id(chatConversation.id) as id,
    (SELECT content, role, createdAt FROM chat_message WHERE chat_conversation = $parendId AND role !='system' ORDER BY createdAt ASC) as messages
        FROM ONLY chat_message
        WHERE chatConversation.project=$projectId
        ORDER BY createdAt DESC LIMIT 1 FETCH chatConversation`,
      { projectId: new RecordId('project', projectId) }
    )
    return result[0]
  },
  addMessageToConversation: async (conversationId: string, message: Message | Message[]) => {
    const db = await getDb()
    const transfromToDbSchema = (m: Message): Omit<ChatMessageDb, 'id' | 'createdAt'> => {
      return {
        ...m,
        chatConversation: new RecordId('chat_conversation', conversationId),
      }
    }
    const input = Array.isArray(message)
      ? message.map(transfromToDbSchema)
      : transfromToDbSchema(message)

    await db.insert(chatMessageTable, input)
  },
}
