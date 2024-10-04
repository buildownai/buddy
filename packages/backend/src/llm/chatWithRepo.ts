import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { chatHistoryRepository } from "../repository/chatHistory.js";
import type { SendSSEFunction } from "../types/index.js";
import { tools } from "./tools/index.js";
import { getNewLLM } from "./getNewLLM.js";
import { config } from "../config.js";

export const chatWithRepo = async (input: {
  projectId: string;
  conversationId: string;
  sendSSE: SendSSEFunction;
  content: string;
  abort?: AbortController;
}) => {
  const llm = getNewLLM();

  const conversation = await chatHistoryRepository.getFullConversationById(
    input.conversationId
  );
  if (!conversation) {
    throw new Error("Invalid conversation");
  }
  const messagesdb = conversation.messages;
  const messages = messagesdb.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({
    role: "user",
    content: input.content,
  });

  const runner = llm.beta.chat.completions
    .runTools(
      {
        model: config.llm.models.chat,
        messages,
        tools: tools.map((tool) => tool(input.projectId)),
        stream: false,
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
