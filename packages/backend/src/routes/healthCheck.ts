import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

const healthCheckResponseSchema = z.object({
  ok: z.boolean().describe("Indicates if the API is operational"),
  message: z
    .string()
    .describe("A message describing the current status of the API"),
});

const healthCheckRoute = createRoute({
  method: "get",
  path: "/",
  description:
    "Check the health status of the API. This endpoint can be used for monitoring and ensuring the API is operational.",
  tags: ["Internal"],
  responses: {
    200: {
      description: "API health status",
      content: {
        "application/json": {
          schema: healthCheckResponseSchema,
          example: {
            ok: true,
            message: "BuildOwn.AI Buddy API is running!",
          },
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: healthCheckResponseSchema,
          example: {
            ok: false,
            message: "An unexpected error occurred while checking API health",
          },
        },
      },
    },
  },
});

app.openapi(healthCheckRoute, (c) => {
  try {
    // Here you can add any additional checks if needed
    // For example, database connection check, external service check, etc.

    return c.json(
      {
        ok: true,
        message: "BuildOwn.AI Buddy API is running!",
      },
      200
    );
  } catch (error) {
    return c.json(
      {
        ok: false,
        message: "An unexpected error occurred while checking API health",
      },
      500
    );
  }
});

export { app as healthCheck };
