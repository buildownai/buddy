import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { config } from "../config.js";
import { codeFileExtension } from "../defaults/codeFileExtensions.js";
import { llmDefaultOptions } from "../defaults/llmDefaultOptions.js";
import logger from "../logger.js";
import { getNewLLM } from "./getNewLLM.js";
import { getSystemPrompt } from "./getSystemPrompt.js";

export const generateSystemPromptContext = async (path: string) => {
  const rootPackageJson = readFileSync(join(path, "package.json"), {
    encoding: "utf8",
  });

  let folderStructure = "";

  const walk = (dir: string, indent = 0) => {
    const files = readdirSync(dir);

    for (const file of files) {
      if (
        [".git", ".DS_Store", "node_modules", ".zed", ".vscode"].includes(file)
      ) {
        continue;
      }
      const f = join(dir, file);
      const stat = statSync(f);
      if (stat.isDirectory()) {
        folderStructure += `${" ".repeat(indent)}|- ${file} (directory)\n`;
        walk(f, indent + 1);
      } else {
        if (!codeFileExtension.includes(extname(file))) {
          continue;
        }
        folderStructure += `${" ".repeat(indent)}|- ${file} (file)\n`;
      }
    }
  };

  walk(path);

  const prompt = `## /package.json
Here is the content of the file \`/package.json\`

${rootPackageJson}

## File & folder structure
Summerize and generalize the file structure:
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
