import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { streamSSE } from "hono/streaming";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path, { extname, join } from "node:path";
import { config } from "../config.js";
import logger from "../logger.js";
import type { JWTPayload } from "../types/index.js";
import { errorResponse } from "./errorResponse.js";
import { protectProjectRouteMiddleware } from "./protectProjectRouteMiddleware.js";

type Variables = { jwtPayload: JWTPayload };

const app = new OpenAPIHono<{ Variables: Variables }>();

app.use("/*", protectProjectRouteMiddleware);

const baseFileItemSchema = z.object({
  type: z
    .enum(["directory", "file"])
    .describe("indicates if it is a file or a directory"),
  path: z.string().describe("the full path"),
  name: z.string().describe("the file or folder name"),
});

type FileItem = z.infer<typeof baseFileItemSchema> & {
  children?: FileItem[];
};

const fileItemSchema: z.ZodType<FileItem> = baseFileItemSchema.extend({
  children: z.lazy(() => baseFileItemSchema.array()),
});

const getFiles = createRoute({
  method: "get",
  path: "/{projectId}/files",
  security: [{ Bearer: [] }],
  description: "Get the project file structure",
  tags: ["Project", "Files"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
  },
  responses: {
    200: {
      description: "Successful returned file structure",
      content: {
        "application/json": {
          schema: z.array(z.any()),
        },
      },
    },
    ...errorResponse,
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message"),
          }),
          example: {
            error: "Not found",
          },
        },
      },
    },
  },
});

interface TreeViewItem {
  name: string;
  id?: string | number;
  children?: TreeViewItem[];
  checked?: boolean;
  selected?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  meta: {
    path: string;
    isDirectory: boolean;
  };
}

app.openapi(getFiles, async (c) => {
  const { projectId } = c.req.param();

  const startDir = join(config.tempDir, projectId);

  const walkDirectory = (dir: string, basePath = ""): TreeViewItem[] => {
    const result: TreeViewItem[] = [];
    const files = readdirSync(dir)
      .sort((a, b) => a.localeCompare(b))
      .sort((a, b) => {
        const filePathA = path.join(dir, a);
        const filePathB = path.join(dir, b);
        const isDirectoryA = statSync(filePathA).isDirectory();
        const isDirectoryB = statSync(filePathB).isDirectory();

        // Directories first
        if (isDirectoryA && !isDirectoryB) return -1;
        if (!isDirectoryA && isDirectoryB) return 1;

        // Alphabetical order if both are directories or both are files
        return a.localeCompare(b);
      });

    for (const file of files) {
      if ([".git", ".DS_Store"].includes(file)) {
        continue;
      }
      const filePath = path.join(dir, file);
      const relativePath = path.join(basePath, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        result.push({
          name: file,
          children: walkDirectory(filePath, relativePath),
          expanded: false,
          selected: false,
          meta: {
            path: `/${relativePath}`,
            isDirectory: true,
          },
        });
      } else {
        result.push({
          name: file,
          meta: {
            path: `/${relativePath}`,
            isDirectory: false,
          },
        });
      }
    }

    return result;
  };

  return c.json(walkDirectory(startDir), 200);
});

const TrailAllSchema = z.instanceof(Uint8Array).openapi({
  description: "Binary data",
  format: "binary",
  example: new Uint8Array(),
});

const getFile = createRoute({
  method: "get",
  path: "/{projectId}/files/*",
  security: [{ Bearer: [] }],
  description: "Get a file from the project",
  tags: ["Project", "Files"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
  },
  responses: {
    200: {
      description: "Successful with the requested file",
      content: {
        "application/octet-stream": {
          schema: TrailAllSchema,
        },
      },
    },
    ...errorResponse,
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message"),
          }),
          example: {
            error: "Not found",
          },
        },
      },
    },
  },
});

app.openapi(getFile, async (c) => {
  const pathArray = new URL(c.req.url).pathname.split("/");
  pathArray.splice(0, 6);
  const filePath = join(config.tempDir, c.req.param().projectId, ...pathArray);

  const file = Bun.file(filePath);

  const exists = await file.exists();

  if (!exists) {
    return c.json({ error: "Not found" }, 404);
  }

  return new Response(file) as any;
});

const deleteFile = createRoute({
  method: "delete",
  path: "/{projectId}/files/*",
  security: [{ Bearer: [] }],
  description: "Delete a file from the project",
  tags: ["Project", "Files"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
  },
  responses: {
    204: {
      description: "Successfully file deleted",
    },
    ...errorResponse,
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message"),
          }),
          example: {
            error: "Not found",
          },
        },
      },
    },
  },
});

app.openapi(deleteFile, async (c) => {
  const pathArray = new URL(c.req.url).pathname.split("/");
  pathArray.splice(0, 6);
  const filePath = join(config.tempDir, c.req.param().projectId, ...pathArray);

  const file = Bun.file(filePath);

  const exists = await file.exists();

  if (!exists) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    await unlink(filePath);

    return c.text("", 204);
  } catch (err) {
    logger.error({ err, filePath }, "failed to delete file from project");
    return c.json({ error: "Failed to delete file" }, 500);
  }
});

const createFile = createRoute({
  method: "post",
  path: "/{projectId}/files",
  security: [{ Bearer: [] }],
  description: "Create a file in the project",
  tags: ["Project", "Files"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            isDirectory: z
              .boolean()
              .describe(
                "Set to true if a directory should be created, false, to create an empty file"
              ),
            path: z
              .string()
              .describe("The path and file/directory name to create"),
          }),
        },
      },
    },
  },
  responses: {
    204: {
      description: "Successfully created a file",
    },
    ...errorResponse,
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message"),
          }),
          example: {
            error: "Not found",
          },
        },
      },
    },
  },
});

app.openapi(createFile, async (c) => {
  const { projectId } = c.req.param();
  const { isDirectory, path } = await c.req.json();

  const filePath = join(config.tempDir, projectId, path);

  const file = Bun.file(filePath);

  const exists = await file.exists();

  if (exists) {
    return c.json({ error: "File or directory already exists" }, 400);
  }

  try {
    if (isDirectory) {
      await mkdir(filePath, { recursive: false });
      return c.text("", 204);
    }

    await Bun.write(file, "");

    return c.text("", 204);
  } catch (err) {
    logger.error({ err, filePath }, "failed to create file in project");
    return c.json({ error: "Failed to create file" }, 500);
  }
});

const getFilesStream = createRoute({
  method: "get",
  path: "/{projectId}/filestream",
  security: [{ Bearer: [] }],
  description: "Get the js/ts related files",
  tags: ["Project", "Files"],
  request: {
    params: z.object({
      projectId: z.string().describe("The ID of the project"),
    }),
  },
  responses: {
    200: {
      description: "Successful response with SSE stream",
      content: {
        "text/event-stream": {
          schema: z.object({
            path: z.string(),
            content: z.string(),
          }),
        },
      },
    },
    ...errorResponse,
    404: {
      description: "File not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().describe("Error message"),
          }),
          example: {
            error: "Not found",
          },
        },
      },
    },
  },
});

app.openapi(getFilesStream, async (c) => {
  const { projectId } = c.req.param();

  const baseDir = join(config.tempDir, projectId);

  return streamSSE(c, async (stream) => {
    let id = 0;
    const walkDirectory = async (dir: string) => {
      const fullPath = join(baseDir, dir);
      const files = readdirSync(fullPath);

      for (const file of files) {
        if ([".git", ".DS_Store"].includes(file)) {
          continue;
        }
        const filePath = path.join(fullPath, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          walkDirectory(join(dir, file));
        } else {
          if (
            ![
              ".js",
              ".ts",
              ".tsx",
              "jsx",
              ".vue",
              ".cjs",
              ".mjs",
              ".cts",
              ".mts",
              ".json",
              ".vue",
            ].includes(extname(filePath))
          ) {
            continue;
          }
          await stream.writeSSE({
            data: JSON.stringify({
              content: readFileSync(filePath, { encoding: "utf-8" }),
              path: `/${join(dir, file)}`,
            }),
            id: String(id++),
          });
        }
      }
    };

    await walkDirectory("");
  }) as any;
});

export { app as projectFiles };
