import fs from "node:fs/promises";
import path from "node:path";
import simpleGit, {
  type SimpleGit,
  type SimpleGitProgressEvent,
} from "simple-git";
import { config } from "../../config.js";
import logger from "../../logger.js";
import { projectRepository } from "../../repository/project.js";
import type { SendProgress } from "../../types/index.js";

export const cloneRepo = async (
  userId: string,
  repoUrl: string,
  sendProgress: SendProgress
) => {
  const id = await projectRepository.createProjectForUser(userId, repoUrl);
  const clonePath = path.join(config.tempDir, id);

  // Ensure the temp directory exists
  await fs.mkdir(config.tempDir, { recursive: true });

  // Send "Start cloning" message
  await sendProgress("Start cloning", 0);

  // Initialize simple-git with progress handler
  const progress = async ({
    method,
    stage,
    progress,
  }: SimpleGitProgressEvent) => {
    const message = `git.${method} ${stage} stage ${progress}% complete`;
    logger.debug({ method, stage, progress }, message);
    await sendProgress(message, progress);
  };

  const git: SimpleGit = simpleGit({ baseDir: config.tempDir, progress });

  // Clone the repository
  logger.info({ repoUrl, clonePath }, "Cloning repository");
  await git.clone(repoUrl, clonePath, ["--progress"]);

  // Repository cloned successfully
  logger.info({ repoUrl }, "Repository cloned successfully");
  await sendProgress("Repository cloned successfully", 100);

  return { clonePath, projectId: id };
};
