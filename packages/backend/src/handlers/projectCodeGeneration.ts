import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { applyChanges, fillInTheMiddleCode } from "../llm/index.js";
import logger from "../logger.js";
import type { JWTPayload, SendSSEFunction } from "../types/index.js";
import { errorResponse } from "./errorResponse.js";
import { protectProjectRouteMiddleware } from "./protectProjectRouteMiddleware.js";

type Variables = { jwtPayload: JWTPayload };

const app = new OpenAPIHono<{ Variables: Variables }>();

app.use("*", protectProjectRouteMiddleware);

const fillInTheMiddleCodeRoute = createRoute({
  method: "post",
  path: "/{projectId}/fill-middle-code",
  security: [{ Bearer: [] }],
  description: "One time shoot for fill in the middle (autocomplete) tasks",
  tags: ["AI-Chat"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().describe("The message to send"),
            suffix: z
              .string()
              .describe("TThe optional suffix for fill in the middle"),
            language: z.string().describe("The language hint"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "FIM code compleetion suggestion",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    ...errorResponse,
  },
});

app.openapi(fillInTheMiddleCodeRoute, async (c) => {
  const { projectId } = c.req.valid("param");
  const { message, suffix, language } = c.req.valid("json");

  logger.info({ projectId }, "Starting fill in the middle generation");

  const response = await fillInTheMiddleCode(
    projectId,
    message,
    suffix,
    language
  );

  logger.debug({ response }, "fill in the middle response");

  return c.text(response, 200);
});

const applyCodeRoute = createRoute({
  method: "post",
  path: "/{projectId}/apply-code",
  security: [{ Bearer: [] }],
  description:
    "Apply code changes to existing code. Send a message to the project generate and receive a response via SSE",
  tags: ["AI-Chat"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            original: z.string().describe("The original code"),
            codeToApply: z
              .string()
              .describe("The code to apply on the original code"),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: z.object({
            event: z.enum(["start", "token", "end", "error"]),
            data: z.string(),
          }),
        },
      },
    },
    ...errorResponse,
  },
});

app.openapi(applyCodeRoute, async (c) => {
  const { projectId } = c.req.valid("param");
  const { original, codeToApply } = c.req.valid("json");

  logger.info({ projectId }, "Applying code");

  return streamSSE(
    c,
    async (stream) => {
      let id = 0;

      stream.onAbort(() => {
        logger.debug("SSE stream aborted!");
      });

      const sendSSE: SendSSEFunction = async (event) =>
        stream.writeSSE({
          data: JSON.stringify(event),
          event: event.event,
          id: String(id++),
        });

      try {
        const responseGenerator = await applyChanges(
          projectId,
          original,
          codeToApply
        );

        for await (const token of responseGenerator) {
          await sendSSE({
            event: "token",
            content: token.choices[0]?.delta?.content ?? "",
            role: "assistent",
          });
        }
      } catch (error) {
        logger.error({ error, projectId }, "Error during apply code");
        await sendSSE({
          event: "error",
          content:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    },
    async (err, stream) => {
      logger.error({ err }, "Error in SSE stream");
      await stream.close();
    }
  ) as any;
});

export { app as projectCodeGeneration };
