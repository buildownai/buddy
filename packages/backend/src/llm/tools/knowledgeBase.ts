import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { generateAnswer } from "../../llm/index.js";
import logger from "../../logger.js";
import { knowledgeRepository } from "../../repository/knowledge.js";
import { validateParams } from "./toolHelper.js";

const paramSchema = z.object({
  searchQuery: z
    .string()
    .describe("Question about which context information is needed"),
});

export const knowledgeBase = (projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: JSON.parse,
      function: async (input: unknown) => {
        try {
          const { searchQuery } = validateParams(paramSchema, input);

          const context = (
            await knowledgeRepository.findKnowledge(projectId, searchQuery)
          )
            .map((res) => `## Source file ${res.file}\n${res.pageContent}`)
            .join("\n");

          const answer = await generateAnswer(`${searchQuery}
    ---
    Context:

    ${context}
    `);

          return answer;
        } catch (err) {
          logger.error(
            { err, input },
            "Wrong input in tool call knowledge_base"
          );
          return "Error: Sorry, but unable to find the information";
        }
      },
      name: "get_context",
      description: "Enhance the context with relevant or missing information",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
