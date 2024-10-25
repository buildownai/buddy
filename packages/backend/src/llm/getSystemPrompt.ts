import { dirname, join } from "node:path";
import logger from "../logger";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs";

type PromptNames =
  | "DefaultChatPrompt"
  | "KnowledgeAnswer"
  | "ApplyCode"
  | "HtmlToMarkdown"
  | "FillInMiddle"
  | "GenSrcFileDescription"
  | "GenPrjDescription"
  | "SummarizeChatConversation";

const prompts = new Map<PromptNames, string>();

const loadPrompts = () => {
  logger.debug("Loading System prompts...");
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const basePath = join(__dirname, "prompts");

  const defaultSystemPrompt = readFileSync(
    join(basePath, "defaultSystemPrompt.md"),
    { encoding: "utf-8" }
  );
  prompts.set("DefaultChatPrompt", defaultSystemPrompt);

  const knowledgeAnswerPrompt = readFileSync(
    join(basePath, "knowledgeAnswerSystemPrompt.md"),
    { encoding: "utf-8" }
  );
  prompts.set("KnowledgeAnswer", knowledgeAnswerPrompt);

  const applyCodePrompt = readFileSync(join(basePath, "applyCodePrompt.md"), {
    encoding: "utf-8",
  });
  prompts.set("ApplyCode", applyCodePrompt);

  const convertHtmlToMarkdown = readFileSync(
    join(basePath, "convertHtmlToMarkdown.md"),
    { encoding: "utf-8" }
  );
  prompts.set("HtmlToMarkdown", convertHtmlToMarkdown);

  const fim = readFileSync(join(basePath, "fillInTheMiddlePrompt.md"), {
    encoding: "utf-8",
  });
  prompts.set("FillInMiddle", fim);

  const genSrcFileDesc = readFileSync(
    join(basePath, "genSrcFileDescription.md"),
    {
      encoding: "utf-8",
    }
  );
  prompts.set("GenSrcFileDescription", genSrcFileDesc);

  const genPrjDesc = readFileSync(join(basePath, "genPrjDescription.md"), {
    encoding: "utf-8",
  });
  prompts.set("GenPrjDescription", genPrjDesc);

  const summarizeChatConversation = readFileSync(
    join(basePath, "summarizeChatConversation.md"),
    {
      encoding: "utf-8",
    }
  );
  prompts.set("SummarizeChatConversation", summarizeChatConversation);

  logger.debug("System prompts loaded");
};

export const getSystemPrompt = (
  promptName: PromptNames,
  replacePlaceholderString?: string
) => {
  const prompt = prompts.get(promptName);
  if (!prompt) {
    logger.error({ promptName }, "System prompt not found");
    throw new Error("System prompt not found");
  }

  return replacePlaceholderString
    ? prompt.replaceAll("%PLACE_HOLDER%", replacePlaceholderString)
    : prompt;
};

loadPrompts();
