import {
  type ChatResponse,
  type ErrorResponse,
  type Message,
  Ollama,
} from "ollama";
import { config } from "./config.js";
import { availableFunctions, tools } from "./llm/tools/index.js";
import logger from "./logger.js";
import { chatHistoryRepository } from "./repository/chatHistory.js";
import type { SendSSEFunction } from "./types/index.js";

class AbortableAsyncIterator<T extends object> {
  private readonly abortController: AbortController;
  private readonly itr: AsyncGenerator<T | ErrorResponse>;
  private readonly doneCallback: () => void;

  constructor(
    abortController: AbortController,
    itr: AsyncGenerator<T | ErrorResponse>,
    doneCallback: () => void
  ) {
    this.abortController = abortController;
    this.itr = itr;
    this.doneCallback = doneCallback;
  }

  abort() {
    this.abortController.abort();
  }

  async *[Symbol.asyncIterator]() {
    for await (const message of this.itr) {
      if ("error" in message) {
        throw new Error(message.error);
      }
      yield message;
      // message will be done in the case of chat and generate
      // message will be success in the case of a progress response (pull, push, create)
      if ((message as any).done || (message as any).status === "success") {
        this.doneCallback();
        return;
      }
    }
    throw new Error("Did not receive done or success response in stream.");
  }
}

export const chatWithRepo = async (input: {
  projectId: string;
  conversationId: string;
  sendSSE: SendSSEFunction;
  content?: string;
  llm?: Ollama;
  abort?: AbortController;
  messages?: Message[];
}): Promise<AbortableAsyncIterator<ChatResponse>> => {
  const ollama = input.llm ?? new Ollama({ host: config.llm.url });
  if (input.content) {
    logger.debug("persisting message");
    // persist the user message in db
    await chatHistoryRepository.addMessageToConversation(input.conversationId, {
      role: "user",
      content: input.content,
    });
  }

  let messages: Message[];
  if (!input.messages) {
    logger.debug("fetching messages");
    const conversation = await chatHistoryRepository.getFullConversationById(
      input.conversationId
    );
    if (!conversation) {
      throw new Error("Invalid conversation");
    }
    messages = conversation.messages;
  } else {
    messages = input.messages;
  }

  logger.debug("Calling ollama");

  if (input.abort) {
    input.abort.signal.addEventListener("abort", () => {
      ollama.abort();
      logger.debug("Ollama request aborted");
    });
  }

  const response = await ollama.chat({
    model: config.llm.models.chat,
    messages,
    stream: false,
    tools,
    options: {
      temperature: 0,
      top_k: 40,
      top_p: 0.95,
      repeat_penalty: 1.1,
    },
  });

  messages.push(response.message);

  async function* generateResponse(input: ChatResponse) {
    yield input;
  }

  if (!response.message.tool_calls?.length) {
    logger.debug("Returning response directly - no tool calls");
    return new AbortableAsyncIterator(
      input.abort ?? new AbortController(),
      generateResponse(response),
      () => {}
    );
  }

  for (const tool of response.message.tool_calls) {
    logger.debug(`Calling function ${tool.function.name}`);
    const toolEntry = availableFunctions.get(tool.function.name);
    if (!toolEntry) {
      messages.push({
        role: "tool",
        content: `Error: There is no tool ${tool.function.name} available`,
      });
      continue;
    }
    const functionResponse = await toolEntry.fn(
      { ...tool.function.arguments, projectId: input.projectId },
      input.sendSSE
    );

    const content =
      typeof functionResponse === "string"
        ? functionResponse
        : JSON.stringify(functionResponse);
    await input.sendSSE(
      "info",
      `Calling tool ${tool.function.name} with arguments ${JSON.stringify(
        tool.function.arguments
      )}: ${content}`
    );

    logger.debug({ toolName: tool.function.name }, "Tool Response");

    messages.push({
      role: "tool",
      content,
    });
  }

  return await chatWithRepo({
    projectId: input.projectId,
    conversationId: input.conversationId,
    sendSSE: input.sendSSE,
    llm: ollama,
    messages,
  });
};

export const generateCode = async (
  projectId: string,
  conversationId: string,
  content: string,
  suffix?: string
) => {
  const ollama = new Ollama({ host: config.llm.url });
  logger.debug("Calling ollama Generate");

  return await ollama.generate({
    model: config.llm.models.code,
    prompt: content,
    system:
      "You are a code generator and you return only the generated code without further explainantion as plain text without backticks",
    suffix,
    stream: true,
    options: {
      temperature: 0,
    },
  });
};
