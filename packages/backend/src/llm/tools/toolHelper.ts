import type { UnknownKeysParam, ZodRawShape, ZodSchema, z } from "zod";
import logger from "../../logger.js";

export const validateParams = <T extends object>(
  schema: z.ZodSchema<T>,
  input: unknown
): T => {
  const s = schema;

  const validation = s.safeParse(input);
  if (!validation.success) {
    logger.error({ input }, "invalid input");
    throw {
      message: "Invalid tool parameters provided",
      error: validation.error.message,
    };
  }
  return validation.data;
};

export const parseToolParameter =
  <T extends object>(paramSchema: ZodSchema<T>) =>
  (input: string) => {
    const parameter = JSON.parse(input);
    return validateParams(paramSchema, parameter);
  };
