import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { projectRepository } from "../repository/project.js";
import type { JWTPayload } from "../types/index.js";
import { errorResponse } from "./errorResponse.js";

type Variables = { jwtPayload: JWTPayload };

const app = new OpenAPIHono<{ Variables: Variables }>();

const projectsRoute = createRoute({
  method: "get",
  path: "/",
  description: "Liste all projects of the user",
  security: [{ bearerAuth: [] }],
  tags: ["Project"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              icon: z.string(),
            })
          ),
        },
      },
      description: "List of projects",
    },
    ...errorResponse,
  },
});

app.openapi(projectsRoute, async (c) => {
  const { id } = c.get("jwtPayload");

  const projects = await projectRepository.getProjectsForUser(id);
  return c.json(projects, 200);
});

const getProjectRoute = createRoute({
  method: "get",
  path: "/{projectId}",
  description: "Get the project information for a single project",
  security: [{ bearerAuth: [] }],
  tags: ["Project"],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            icon: z.string(),
            repositoryUrl: z.string(),
          }),
        },
      },
      description: "Project details",
    },
    ...errorResponse,
  },
});

app.openapi(getProjectRoute, async (c) => {
  const { id } = c.get("jwtPayload");

  const project = await projectRepository.getProjectByIdForUser(
    id,
    c.req.valid("param").id
  );
  return c.json(project, 200);
});

export { app as projects };
