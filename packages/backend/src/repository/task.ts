import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { RecordId, Table } from "surrealdb";
import { config } from "../config.js";
import { getDb } from "../db.js";
import { codeFileExtension } from "../defaults/codeFileExtensions.js";
import { TaskKind, TaskStatus } from "../types/index.js";
import type { ProjectDB } from "./project.js";

const taskTable = new Table("task");

type TaskDb = {
  project: RecordId<"project">;
  status: TaskStatus;
  kind: TaskKind;
  payload: Record<string, unknown>;
  branch?: string;
};

export type TaskReadDb = TaskDb & {
  id: RecordId<"task">;
  createdAt: Date;
  updatedAt: Date;
};

export const taskRepository = {
  createIndexNewProjectTasks: async (projectId: string) => {
    const db = await getDb();
    const prj = await db.select<ProjectDB>(new RecordId("project", projectId));

    const folder = prj.localFolder ?? join(config.tempDir, projectId);

    const tasks: TaskDb[] = [];

    const walkDir = (dir = "") => {
      const files = readdirSync(join(folder, dir));

      for (const file of files) {
        if (
          [".git", "node_modules", ".DS_Store", ".zed", ".vscode"].includes(
            file
          )
        ) {
          continue;
        }

        const stat = statSync(join(folder, dir, file));
        if (stat.isDirectory()) {
          walkDir(join(dir, file));
        } else {
          // do not index files which are not code
          if (!codeFileExtension.includes(extname(file))) {
            continue;
          }

          const s = file.split(".");
          // skip indexing of test files (.spec.* and .test.*)
          if (s.length >= 3) {
            if (
              ["spec", "test"].includes(s[s.length - 2].trim().toLowerCase())
            ) {
              continue;
            }
          }
          tasks.push({
            project: new RecordId("project", projectId),
            status: TaskStatus.PENDING,
            kind: TaskKind.INDEX_FILE,
            payload: {
              file: `/${join(dir, file)}`,
              pageContent: readFileSync(join(folder, dir, file), {
                encoding: "utf-8",
              }),
            },
          });
        }
      }
    };

    walkDir();

    await db.insert(taskTable, tasks);
  },
  addFileIndexTask: async (
    projectId: string,
    file: string,
    branch = "main"
  ) => {
    const db = await getDb();

    const prj = await db.select<ProjectDB>(new RecordId("project", projectId));

    const absolutePath =
      prj.localFolder ?? join(config.tempDir, projectId, file);

    await db.insert(taskTable, {
      project: new RecordId("project", projectId),
      status: TaskStatus.PENDING,
      kind: TaskKind.INDEX_FILE,
      payload: {
        file: `/${file}`,
        branch,
        pageContent: readFileSync(absolutePath, {
          encoding: "utf-8",
        }),
      },
    });
  },
  getNextPendingTask: async () => {
    const db = await getDb();
    const taskResult = await db.query<[TaskReadDb]>(
      `SELECT * FROM ONLY task WHERE (status="${TaskStatus.RUNNING}" OR status="${TaskStatus.PENDING}") ORDER BY createdAt ASC LIMIT 1`
    );

    return taskResult[0];
  },
  getTaskById: async (taskId: string) => {
    const db = await getDb();
    const res = await db.query<[TaskReadDb]>(
      "SELECT * FROM ONLY $task LIMIT 1 FETCH job",
      {
        task: new RecordId("task", taskId),
      }
    );
    return res[0];
  },
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    const db = await getDb();
    await db.merge(new RecordId("task", taskId), { status });
  },
};
