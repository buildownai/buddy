import { Ollama } from "ollama";
import { config } from "../config.js";
import logger from "../logger.js";
import type { SendProgress } from "../types/index.js";

const getHost = () => {
  const url = new URL(config.llm.url);
  return url.protocol + "//" + url.host;
};

export const hasModel = async (model: string) => {
  const ollama = new Ollama({ host: getHost() });
  const models = await ollama.list();
  return models.models.some((m) => m.name === model);
};

export const pullModel = async (model: string, sendProgress: SendProgress) => {
  const ollama = new Ollama({ host: getHost() });
  const modelAvailable = await hasModel(model);
  if (modelAvailable) {
    logger.info(`Model ${model} already available`);
    await sendProgress(`Model ${model} already available`, 100);
    return;
  }
  const res = await ollama.pull({ model, stream: true });
  logger.info(`Pulling model ${model}`);
  for await (const event of res) {
    if (event.total > 0) {
      const percentage = Math.round((event.completed / event.total) * 100);
      await sendProgress(
        `${event.status}: Pulling model ${model}`,
        Math.min(percentage, 100) // Ensure we never exceed 100%
      );
    } else {
      await sendProgress(`${event.status}: Pulling model ${model}`, 0);
    }
  }
  logger.info(`Model ${model} pulled`);
};
