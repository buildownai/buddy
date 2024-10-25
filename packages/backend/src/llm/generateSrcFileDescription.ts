import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const generateSrcFileDescription = async (
  content: string,
  file: string
) => {
  const llm = getNewLLM();
  logger.debug({ file }, "start generating src file description");
  const response = await llm.chat.completions.create({
    model: config.llm.models.small,
    messages: [
      {
        role: "system",
        content: getSystemPrompt("GenSrcFileDescription", file),
      },
      { role: "user", content },
    ],
    stream: true,
    ...llmDefaultOptions,
  });

  let result = "";

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta.content;
    if (content) {
      result += content;
    }
  }

  return result;
};
