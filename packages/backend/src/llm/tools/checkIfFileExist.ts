import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { validateParams } from "./toolHelper.js";

const paramSchema = z.object({
  path: z.string().describe("The path to the file or deirectory"),
});

export const toolCheckIfFileExist = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: JSON.parse,
      function: async (input: unknown) => {
        try {
          const { path } = validateParams(paramSchema, input);
          const p = join(config.tempDir, projectId, path);
          const exists = existsSync(p);
          if (!exists) {
            return `File or directory ${path} does not exist in the project`;
          }
          const stat = statSync(p);

          return `${
            stat.isDirectory() ? "Directory" : "File"
          } ${path} exists in the project`;
        } catch (err) {
          logger.error({ err, input }, "Wrong input in tool call write_file");
          return "Error: Sorry, but unable to write file";
        }
      },
      name: "check_if_file_exist",
      description:
        "Checks if the given file or directory exists in the project",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
