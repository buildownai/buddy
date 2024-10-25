import { readFileSync, statSync } from "node:fs";
import path, { join } from "node:path";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { validateParams } from "./toolHelper.js";
import { toolGetFolderStructure } from "./folderStructure.js";

const paramSchema = z.object({
  path: z.string().describe("The path to the file"),
});

export const toolReadFile = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: JSON.parse,
      function: async (input: unknown) => {
        try {
          const { path } = validateParams(paramSchema, input);
          const p = join(config.tempDir, projectId, path);
          const stat = statSync(p);
          if (stat.isFile()) {
            const content = readFileSync(p, "utf8");

            return `The path \`${path}\` is a file. Here is the file content:

${content}
`;
          }

          const { function: definition } = toolGetFolderStructure(projectId);

          const result = await definition.function({ path });

          return `The path \`${path}\` is directory.
Here is a list of files and subfolders:

${result}
`;
        } catch (err) {
          logger.error({ err, input }, "Wrong input in tool call read_file");
          return "Error: Sorry, but unable to read file";
        }
      },
      name: "read_file",
      description: "Get the file or directory content for a given path",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
