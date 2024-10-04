import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import { getNewLLM } from "./getNewLLM.js";

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
        content: `You are a ${language} code generator wich fills in the middle marked as <FIM>.
The users language is english.
Return only the code which is replacing <FIM>.
If you can not fill in the middle or it is an empty string, return only the word FAILED.
NEVER return the content before or after <FIM>.
Return the only code of <FIM> as plain text.
`,
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
