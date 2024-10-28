import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { parseToolParameter } from "./toolHelper.js";

const paramSchema = z.object({
  path: z.string().describe("The path to the file or deirectory"),
});

export const toolCheckIfFileExist = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: parseToolParameter(paramSchema),
      function: async (input: z.output<typeof paramSchema>) => {
        try {
          const { path } = input;
          const p = join(config.tempDir, projectId, path);
          const exists = existsSync(p);
          if (!exists) {
            return `File or directory ${path} does not exist in the project`;
          }
          const stat = statSync(p);

          if (stat.isDirectory()) {
            return `Directory \`${path}\` exists. You must use the tool get_folder_structure to get list of files and subfolders.`;
          }

          return `File \`${path}\` exists. You must use the tool read_file to get the file content.`;
        } catch (err) {
          logger.error(
            { err, input },
            "Wrong input in tool call check_if_file_exist"
          );
          return "Error: Sorry, but unable tocheck file";
        }
      },
      name: "check_if_file_exist",
      description:
        "Checks if the given file or directory exists in the project. Do not use when you need the file content.",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
