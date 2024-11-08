import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import logger from "../../logger.js";
import { convertHtmlToMarkdown } from "../convertHtmlToMarkdown.js";
import { parseToolParameter } from "./toolHelper.js";

const paramSchema = z.object({
  url: z.string().url().describe("The URL of the webpage to fetch"),
});

function removeScriptAndStyleTagsWithRegex(html: string): string {
  // Remove <script> tags and their content
  const withoutScript = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove <style> tags and their content
  const withoutStyle = withoutScript.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  return withoutStyle;
}

export const toolFetchWebpage = (_projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: parseToolParameter(paramSchema),
      function: async (input: z.output<typeof paramSchema>) => {
        try {
          const { url } = input;
          const result = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
          });
          if (!result.ok) {
            logger.error(
              { url },
              `Unable to fetch the webpage. Status code ${result.status}`
            );
            return `Unable to fetch the webpage. Status code ${result.status}`;
          }

          const webpageContent = await result.text();

          const md = await convertHtmlToMarkdown(
            removeScriptAndStyleTagsWithRegex(webpageContent)
          );

          return md;
        } catch (err) {
          logger.error(
            { err, input },
            "Wrong input in tool call fetch_webpage"
          );
          return "Unable to fetch the webpage. Please check your URL";
        }
      },
      name: "fetch_webpage",
      description: "Fetch a webpage or make a HTTP request to external URLs",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
