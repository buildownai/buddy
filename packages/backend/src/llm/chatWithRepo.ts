import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { chatHistoryRepository } from "../repository/chatHistory.js";
import type { Project, SendSSEFunction } from "../types/index.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";
import { tools } from "./tools/index.js";

export const chatWithRepo = async (input: {
  conversationId: string;
  sendSSE: SendSSEFunction;
  content: string;
  abort?: AbortController;
  project: Project;
}) => {
  const llm = getNewLLM();

  const conversation = await chatHistoryRepository.getFullConversationById(
    input.conversationId
  );
  if (!conversation) {
    throw new Error("Invalid conversation");
  }
  const messagesdb = conversation.messages;
  const messages = [
    {
      role: "system",
      content: getSystemPrompt("DefaultChatPrompt", input.project.description),
    },
  ];

  messages.push(
    ...messagesdb.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user",
      content: input.content,
    }
  );

  const runner = llm.beta.chat.completions
    .runTools(
      {
        model: config.llm.models.chat,
        messages,
        tools: tools.map((tool) => tool(input.project.id)),
        stream: false,
        ...llmDefaultOptions,
      },
      { signal: input.abort?.signal }
    )
    .on("message", (message) => console.log(message))
    .on("abort", () => logger.debug("Chat request aborted"))
    .on("functionCallResult", (content) =>
      logger.debug({ content }, "Tool response")
    )
    .on("functionCall", async (content) => {
      logger.debug({ content }, "Function call");
      await input.sendSSE({
        event: "tool_call",
        name: content.name,
        arguments: JSON.parse(content.arguments),
      });
    });

  return runner.finalContent();
};
