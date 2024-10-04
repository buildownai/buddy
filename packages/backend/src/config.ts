import os from "node:os";
import path, { join } from "node:path";
import { cwd } from "node:process";
import { z } from "zod";

const ConfigSchema = z.object({
  port: z.coerce
    .number()
    .int()
    .positive()
    .default(3000)
    .describe("Port number for the server to listen on"),
  environment: z
    .enum(["development", "production"])
    .default("development")
    .describe("Current environment (development or production)"),
  apiBasePath: z.string().default("/api").describe("Base path for API routes"),
  corsOrigin: z.string().default("*").describe("Allowed origins for CORS"),
  tempDir: z
    .string()
    .default(path.join(os.tmpdir(), "pilot-repos"))
    .describe("Temporary directory for cloned repositories"),
  logLevel: z
    .string()
    .default("info")
    .describe("Logging level (e.g., info, debug, error)"),
  surrealdb: z
    .object({
      url: z
        .string()
        .url()
        .default("ws://127.0.0.1:8000")
        .describe("SurrealDB connection URL"),
      user: z.string().default("root").describe("SurrealDB username"),
      pass: z.string().default("root").describe("SurrealDB password"),
      database: z.string().default("pilot").describe("SurrealDB database name"),
      namespace: z.string().default("pilot").describe("SurrealDB namespace"),
    })
    .describe("SurrealDB configuration"),
  llm: z
    .object({
      url: z
        .string()
        .url()
        .default("http://127.0.0.1:11434/v1")
        .describe("LLM API URL"),
      apiKey: z
        .string()
        .default("API_KEY")
        .describe("The LLM Provider API Key"),
      embeddingSize: z.coerce
        .number()
        .default(768)
        .describe("The dimension of the embedding vectors"),
      ollamaEnabled: z.coerce
        .boolean()
        .default(true)
        .describe("Enable Ollama as AI provider - enables model pulling"),
      models: z.object({
        chat: z
          .string()
          .default("qwen2.5-coder:latest")
          .describe("Default LLM model to use"),
        small: z
          .string()
          .default("qwen2.5-coder:latest")
          .describe("Default LLM model to use"),
        code: z
          .string()
          .default("qwen2.5-coder:latest")
          .describe("Model used for code generation"),
        html: z
          .string()
          .default("reader-lm:1.5b")
          .describe(
            "Model used for converting html nto markdown for llm usage"
          ),
        embeddings: z
          .string()
          .default("nomic-embed-text:latest")
          .describe("LLM embedder model to use"),
      }),
    })
    .describe("LLM configuration"),
  jwtSecret: z
    .string()
    .min(32)
    .default("your-secret-key-must-be-at-least-32-chars")
    .describe("Secret key for JWT signing (min 32 characters)"),
  jwtAlgorithm: z
    .enum(["HS256", "HS384", "HS512"])
    .default("HS256")
    .describe("Algorithm to use for JWT signing"),
});

export type Config = z.infer<typeof ConfigSchema>;

const parseConfig = (): Config => {
  return ConfigSchema.parse({
    port: process.env.PORT,
    environment: process.env.NODE_ENV,
    apiBasePath: process.env.API_BASE_PATH,
    corsOrigin: process.env.CORS_ORIGIN,
    tempDir: join(cwd(), "repos"), //process.env.TEMP_DIR,
    logLevel: process.env.LOG_LEVEL,
    surrealdb: {
      url: process.env.SURREAL_DB_URL,
      user: process.env.SURREAL_DB_USER,
      pass: process.env.SURREAL_DB_PASS,
      database: process.env.SURREAL_DB_DATABASE,
      namespace: process.env.SURREAL_DB_NAMESPACE,
    },
    llm: {
      url: process.env.LLM_URL,
      apiKey: process.env.OPENAI_API_KEY,
      embeddingSize: process.env.LLM_EMBEDDING_SIZE,
      ollamaEnabled: process.env.OLLAMA_ENABLED,
      models: {
        chat: process.env.LLM_MODEL_CHAT,
        small: process.env.LLM_MODEL_SMALL,
        code: process.env.LLM_MODEL_CODE,
        html: process.env.LLM_MODEL_HTML,
        embeddings: process.env.LLM_MODEL_EMBEDDINGS,
      },
    },
    jwtSecret: process.env.JWT_SECRET,
    jwtAlgorithm: process.env.JWT_ALGORITHM,
  });
};

export const config = parseConfig();
