import { RecordId, Table } from "surrealdb";
import { getDb } from "../db.js";
import logger from "../logger.js";
import type { Project } from "../types/index.js";

export type ProjectDB = {
  id: RecordId<"project">;
  repositoryUrl: string;
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
};

const projectTable = new Table("project");

export const projectRepository = {
  createProjectForUser: async (userId: string, repositoryUrl: string) => {
    const db = await getDb();
    const project: Omit<ProjectDB, "id" | "createdAt"> = {
      repositoryUrl,
      name: repositoryUrl,
      description: "",
      icon: "",
    };
    const res = await db.create(projectTable, project);
    logger.debug({ userId, res }, "create project");
    await db.relate(new RecordId("user", userId), "can_access", res.id);

    return res.id.id as string;
  },
  updateProject: async (
    projectId: string,
    input: Partial<Omit<ProjectDB, "id" | "createdAt">>
  ) => {
    const db = await getDb();
    await db.merge(new RecordId(projectTable.tb, projectId), input);
  },
  getProjectsForUser: async (userId: string) => {
    const db = await getDb();
    const result = await db.query<[{ projects: ProjectDB[] }]>(
      "SELECT ->can_access->project.* as projects FROM ONLY $userId LIMIT 1",
      { userId: new RecordId("user", userId) }
    );

    if (!result[0]) {
      return [];
    }

    return result[0].projects.map((project) => ({
      ...project,
      id: project.id.id,
    }));
  },
  getProjectById: async (projectId: string): Promise<Project | undefined> => {
    const db = await getDb();
    const result = await db.query<[ProjectDB]>("SELECT * FROM ONLY $project;", {
      project: new RecordId(projectTable.tb, projectId),
    });

    if (!result.length) {
      return;
    }

    return {
      description: result[0].description,
      icon: result[0].icon,
      name: result[0].name,
      repoUrl: result[0].repositoryUrl,
      id: result[0].id.id as string,
      createdAt: result[0].createdAt,
    };
  },
  getProjectByIdForUser: async (
    userId: string,
    projectId: string
  ): Promise<Project | undefined> => {
    const db = await getDb();
    const result = await db.query<[ProjectDB]>(
      "SELECT * FROM ONLY $userId->can_access->project WHERE id=$projectId LIMIT 1;",
      {
        userId: new RecordId("user", userId),
        projectId: new RecordId(projectTable.tb, projectId),
      }
    );

    if (!result.length) {
      return;
    }

    return {
      description: result[0].description,
      icon: result[0].icon,
      name: result[0].name,
      repoUrl: result[0].repositoryUrl,
      id: result[0].id.id as string,
      createdAt: result[0].createdAt,
    };
  },
};
