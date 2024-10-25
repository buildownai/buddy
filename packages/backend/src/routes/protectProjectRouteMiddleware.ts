import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import logger from "../logger.js";
import { projectRepository } from "../repository/project.js";
import type { JWTPayload, Project } from "../types/index.js";

type Variables = { jwtPayload: JWTPayload; project: Project };

export const protectProjectRouteMiddleware = createMiddleware<{
  Variables: Variables;
}>(async (c, next) => {
  const validationResult = z.string().safeParse(c.req.path.split("/")[4]);
  if (validationResult.error) {
    throw new HTTPException(404, { message: "Not found1" });
  }
  const { id } = c.get("jwtPayload");
  let project: Project | undefined;
  try {
    project = await projectRepository.getProjectByIdForUser(
      id,
      validationResult.data
    );
  } catch (err) {
    logger.error(
      { err, projectId: validationResult.data },
      "Project not found"
    );
    throw new HTTPException(404, { message: "Not found2" });
  }

  if (!project) {
    logger.error("Project not found - route blocked");
    throw new HTTPException(404, { message: "Not found3" });
  }
  c.set("project", project);
  await next();
});
