import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { chatHistoryRepository } from "../repository/chatHistory.js";
import { getNewLLM } from "./getNewLLM.js";

export const summarizeConversation = async (conversationId: string) => {
  const llm = getNewLLM();
  const messages = await chatHistoryRepository.getRecentConversationMessages(
    conversationId
  );

  const response = await llm.chat.completions.create({
    model: config.llm.models.small,
    messages: [
      {
        role: "system",
        content:
          "You are an AI which summarizes a chat conversation into a single short sentence, which is focusing on the most recent messages.",
      },
      {
        role: "user",
        content: messages
          .map(
            (message) => `${message.role}: ${message.createdAt.toISOString()}
        ${message.content}
  `
          )
          .join("\n\n---\n\n"),
      },
    ],

    stream: false,
    ...llmDefaultOptions,
  });

  logger.debug({ conversationId }, "Conversation summarized");
  return response.choices[0]?.message?.content ?? "";
};
