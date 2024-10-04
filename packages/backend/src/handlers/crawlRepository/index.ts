import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";

import { generateSystemPromptContext } from "../../llm/generateSystemPromptContext.js";
import logger from "../../logger.js";
import { projectRepository } from "../../repository/project.js";
import { taskRepository } from "../../repository/task.js";
import type { SSEMessage, SendProgress } from "../../types/index.js";
import { errorResponse } from "../errorResponse.js";
import { cloneRepo } from "./cloneRepo.js";
import { fetchDependencyTypes } from "./fetchDependencyTypes.js";

const app = new OpenAPIHono();

const sseMessageSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("info"),
    message: z.string().describe("Information message"),
    totalSteps: z
      .number()
      .describe("Total number of steps in the analysis process"),
    steps: z.array(z.string()).describe("Array of step names"),
  }),
  z.object({
    event: z.literal("progress"),
    message: z.string().describe("Progress update message"),
    progress: z.number().describe("Progress percentage"),
    step: z.string().describe("Current step of the analysis"),
  }),
  z.object({
    event: z.literal("complete"),
    message: z.string().describe("Completion message"),
    projectId: z.string().describe("ID of the analyzed project"),
  }),
  z.object({
    event: z.literal("error"),
    message: z.string().describe("Error message"),
  }),
]);

const crawlRoute = createRoute({
  method: "post",
  path: "/",
  security: [{ Bearer: [] }],
  tags: ["Project"],
  description:
    "Clone a Git repository and analyze its contents. This endpoint uses Server-Sent Events (SSE) to stream progress updates.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().describe("The name of the project"),
            localFolder: z
              .string()
              .optional()
              .describe("The local file directory"),
            repositoryUrl: z
              .string()
              .url()
              .optional()
              .describe("The URL of the Git repository to clone and analyze"),
          }),
          example: {
            repositoryUrl: "https://github.com/example/repo.git",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: sseMessageSchema,
          example: {
            message: "git.clone receiving objects stage 50% complete",
            event: "progress",
            id: "1",
          },
        },
      },
    },
    400: {
      description: "Bad request - invalid input",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message describing the issue"),
          }),
          example: {
            error: "Invalid repository URL provided",
          },
        },
      },
    },
    ...errorResponse,
  },
});

app.openapi(crawlRoute, async (c) => {
  const { repositoryUrl, localFolder, name } = c.req.valid("json");
  const { id: userId } = c.get("jwtPayload");

  logger.info({ repositoryUrl }, "Starting repository crawl");

  return streamSSE(c, async (stream) => {
    let id = 0;
    try {
      const sendProgress: SendProgress = async (
        message: string,
        progress = 0,
        step = ""
      ) => {
        const msg: SSEMessage = { message, progress, event: "progress", step };
        await stream.writeSSE({
          data: JSON.stringify(msg),
          event: "progress",
          id: String(id++),
        });
      };

      // Send initial info event
      const infoMsg: SSEMessage = {
        event: "info",
        message: "Starting repository analysis",
        totalSteps: 4,
        steps: [
          "Clone repository",
          "Generate project description",
          "Fetch typescript typings",
        ],
      };
      await stream.writeSSE({
        data: JSON.stringify(infoMsg),
        event: "info",
        id: String(id++),
      });

      // Step 1: Clone repository
      await sendProgress("Cloning repository...", 0, "Clone repository");
      const { clonePath, projectId } = await cloneRepo(
        userId,
        { repositoryUrl, localFolder, name },
        (message, progress) =>
          sendProgress(message, progress, "Clone repository")
      );
      await sendProgress(
        "Repository cloned successfully",
        100,
        "Clone repository"
      );

      await taskRepository.createIndexNewProjectTasks(projectId);

      // Step 2: Generate project settings
      await sendProgress(
        "Generating project description...",
        0,
        "Generate project description"
      );
      const description = await generateSystemPromptContext(clonePath);
      await projectRepository.updateProject(projectId, { description });
      await sendProgress(
        "Project description generated",
        100,
        "Generate project description"
      );

      // Step 3: Fetch typescript typings
      await sendProgress(
        "Fetching typescript types...",
        0,
        "Fetch typescript typings"
      );
      await fetchDependencyTypes(clonePath, (message, progress) =>
        sendProgress(message, progress, "Fetch typescript typings")
      );
      await sendProgress(
        "Typescript types fetched successfully",
        100,
        "Fetch typescript typings"
      );

      // Analysis complete
      const completeMsg: SSEMessage = {
        event: "complete",
        message: "Analysis complete",
        projectId,
      };
      await stream.writeSSE({
        data: JSON.stringify(completeMsg),
        event: "complete",
        id: String(id++),
      });
    } catch (error) {
      logger.error({ error }, "An error occurred during repository crawling");

      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = "An unknown error occurred";
      }

      const errorMsg: SSEMessage = { event: "error", message: errorMessage };
      await stream.writeSSE({
        data: JSON.stringify(errorMsg),
        event: "error",
        id: String(id++),
      });
    } finally {
      stream.close();
    }
  }) as any;
});

export { app as crawlRepository };
