import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const convertHtmlToMarkdown = async (content: string) => {
  const llm = getNewLLM();

  logger.debug("Converting the website to markdown");

  const response = await llm.chat.completions.create({
    model: config.llm.models.html,
    messages: [
      {
        role: "system",
        content: getSystemPrompt("HtmlToMarkdown"),
      },
      { role: "user", content },
    ],
    stream: true,
    ...llmDefaultOptions,
  });

  logger.debug("Website converted");

  let w = "";
  for await (const chunk of response) {
    const x = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(x);
    w += x;
  }

  return w; //response.choices[0]?.message?.content ?? "";
};
