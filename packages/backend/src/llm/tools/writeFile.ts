import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { parseToolParameter } from "./toolHelper.js";

const paramSchema = z.object({
  path: z.string().describe("The path to the file"),
  content: z.string().describe("The full file content as an UTF-8 string"),
});

export const toolWriteFile = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: parseToolParameter(paramSchema),
      function: async (input: z.output<typeof paramSchema>) => {
        try {
          const { path, content } = input;
          const p = join(config.tempDir, projectId, path);
          writeFileSync(p, content, "utf8");
          return `File ${path} written successfully`;
        } catch (err) {
          logger.error({ err, input }, "Wrong input in tool call write_file");
          return "Error: Sorry, but unable to write file";
        }
      },
      name: "write_file",
      description: "Overwrite the file content of a file with given content",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
