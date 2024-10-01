import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { config } from "../../config.js";
import { codeFileExtension } from "../../defaults/codeFileExtensions.js";
import logger from "../../logger.js";
import type { ToolEntry } from "../../types/index.js";
import { validateParams } from "./toolHelper.js";

const paramSchema = z.object({
  path: z
    .string()
    .optional()
    .default("")
    .describe("The absolute path of the sub folder of the project"),
});

export const toolGetFolderStructure: ToolEntry = {
  fn: async (input: unknown) => {
    try {
      const { projectId, path } = validateParams(paramSchema, input);
      const p = join(config.tempDir, projectId, path);
      let folderStructure = "";

      const walk = (dir: string, indent = 0) => {
        const files = readdirSync(dir);

        for (const file of files) {
          if (
            [".git", ".DS_Store", "node_modules", ".zed", ".vscode"].includes(
              file
            )
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

      walk(p);

      return folderStructure;
    } catch (err) {
      logger.error({ err, input }, "Wrong input in tool call read_file");
      return "Error: Sorry, but unable to read file";
    }
  },
  schema: {
    type: "function",
    function: {
      name: "get_folder_file_strcuture",
      description:
        "Get folder and file structure or the project or of a given sub folder of a project",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  },
};
