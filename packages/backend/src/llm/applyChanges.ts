import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const applyChanges = async (
  _projectId: string,
  originalContent: string,
  contentToApply: string
) => {
  const llm = getNewLLM();

  const response = await llm.chat.completions.create({
    model: config.llm.models.code,
    messages: [
      {
        role: "system",
        content: getSystemPrompt("ApplyCode"),
      },
      {
        role: "user",
        content: `Here is the original code

${originalContent}

---
Here are the code changes to apply:

${contentToApply}
    `,
      },
    ],
    stream: true,
    ...llmDefaultOptions,
  });

  return response;
};
