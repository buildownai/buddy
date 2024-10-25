import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const fillInTheMiddleCode = async (
  projectId: string,
  content: string,
  suffix: string,
  language: string
) => {
  const llm = getNewLLM();

  const response = await llm.chat.completions.create({
    model: config.llm.models.code,
    messages: [
      {
        role: "system",
        content: getSystemPrompt("FillInMiddle", language),
      },
      { role: "user", content: `${content}<FIM>${suffix}` },
    ],
    stream: false,
    ...llmDefaultOptions,
  });

  const regex = /```(?:\w+)?\n([\s\S]*?)\n```/;

  const answer = response.choices[0]?.message?.content ?? "";

  const match = answer.match(regex);

  const fim = match ? match[1] : answer;

  return fim.trim().toUpperCase() === "FAILED" ? "" : fim;
};
