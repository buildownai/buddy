import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const generateAnswer = async (query: string, content: string) => {
  const llm = getNewLLM();

  const response = await llm.chat.completions.create({
    model: config.llm.models.chat,
    messages: [
      {
        role: "system",
        content: getSystemPrompt("KnowledgeAnswer", query),
      },
      { role: "user", content },
    ],
    stream: false,
    ...llmDefaultOptions,
    max_completion_tokens: 130_000,
  });

  return response.choices[0]?.message?.content ?? "";
};
