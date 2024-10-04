import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { validateParams } from "./toolHelper.js";

const paramSchema = z.object({
  path: z.string().describe("The path of the folder to create"),
});

export const toolCreateDirectory = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: JSON.parse,
      function: async (input: unknown) => {
        try {
          const { path } = validateParams(paramSchema, input);
          const p = join(config.tempDir, projectId, path);
          mkdirSync(p, { recursive: true });
          return `Directory ${path} created`;
        } catch (err) {
          logger.error(
            { err, input },
            "Wrong input in tool call create_directory"
          );
          return "Error: Sorry, but unable to create directory";
        }
      },
      name: "create_directory",
      description: "Creates a new directory in the project file system",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
