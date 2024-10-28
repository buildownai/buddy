import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { parseToolParameter } from "./toolHelper.js";
import { getFolderStructure } from "../../helper/getFolderStructure.js";

const paramSchema = z.object({
  path: z
    .string()
    .optional()
    .default("")
    .describe("The absolute path of the sub folder of the project"),
});

export const toolGetFolderStructure = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: parseToolParameter(paramSchema),
      function: async (input: z.output<typeof paramSchema>) => {
        try {
          const { path } = input;
          const p = join(config.tempDir, projectId, path);

          return getFolderStructure(p);
        } catch (err) {
          logger.error({ err, input }, "Wrong input in tool call read_file");
          return "Error: Sorry, but unable to read file";
        }
      },
      name: "get_folder_structure",
      description: "Read the folder structure",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
