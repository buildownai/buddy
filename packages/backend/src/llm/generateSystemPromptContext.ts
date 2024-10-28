import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";
import { getFolderStructure } from "../helper/getFolderStructure.js";

export const generateSystemPromptContext = async (path: string) => {
  const rootPackageJson = readFileSync(join(path, "package.json"), {
    encoding: "utf8",
  });

  const folderStructure = getFolderStructure(path);

  const prompt = `## /package.json
Here is the content of the file \`/package.json\`

${rootPackageJson}

## File & folder structure
Summarize and generalize the file structure:
${folderStructure}
  `;

  const llm = getNewLLM();
  const response = await llm.chat.completions.create({
    model: config.llm.models.chat,
    messages: [
      { role: "system", content: getSystemPrompt("GenPrjDescription") },
      { role: "user", content: prompt },
    ],
    stream: false,
    ...llmDefaultOptions,
  });

  logger.debug("System description generated");

  return response.choices[0]?.message?.content ?? "";
};
