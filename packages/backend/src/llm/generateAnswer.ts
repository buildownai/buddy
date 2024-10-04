import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import { getNewLLM } from "./getNewLLM.js";

export const generateAnswer = async (content: string) => {
  const llm = getNewLLM();

  const response = await llm.chat.completions.create({
    model: config.llm.models.chat,
    messages: [
      {
        role: "system",
        content: `
    You are an AI which should answer to a search query or question, only based on the given context.
    If the context does not contain the required information and facts to provide the answer, you must only return the word FAIL without any further explanation`,
      },
      { role: "user", content },
    ],
    stream: false,
    ...llmDefaultOptions,
  });

  return response.choices[0]?.message?.content ?? "";
};
