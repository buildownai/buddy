import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import logger from "../../logger";
import type { ToolEntry } from "../../types/index.js";
import { parseToolParameter } from "./toolHelper.js";

const paramSchema = z.object({
  name: z.string().min(1).describe("The name of the npm package"),
  version: z
    .string()
    .optional()
    .default("latest")
    .describe("The package version"),
});

type NpmPackageVersion = {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  dist: {
    shasum: string;
    tarball: string;
    integrity?: string;
    fileCount?: number;
    unpackedSize?: number;
  };
  homepage?: string;
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  repository?: {
    type: string;
    url: string;
  };
  license?: string;
  keywords?: string[];
};

type NpmPackageResponse = {
  name: string;
  description?: string;
  "dist-tags": {
    latest: string;
    [tag: string]: string; // Support for other tags (e.g., "beta", "next")
  };
  versions: {
    [version: string]: NpmPackageVersion; // A map of all versions
  };
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  readme?: string;
  time?: {
    created: string; // ISO date string
    modified: string; // ISO date string
    [version: string]: string; // Version publish times
  };
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  keywords?: string[];
};

export const getNpmPackageInfo = (_projectId: string) => {
  return {
    type: "function" as const,
    function: {
      parse: parseToolParameter(paramSchema),
      function: async (input: z.output<typeof paramSchema>) => {
        try {
          const { name, version } = input;

          const url = new URL(`${name}`, "https://registry.npmjs.org/");
          const response = await fetch(url);

          if (!response.ok) {
            logger.error(
              { url, status: response.status },
              response.statusText ?? "Failed to fetch"
            );
            throw new Error("Fetching package information failed");
          }

          const info: NpmPackageResponse = await response.json();

          const v = info["dist-tags"].latest;

          const latest = info.versions[v];

          if (!latest) {
            throw new Error(`Version ${v} not found for package ${name}`);
          }

          let result = `# Package ${latest.name} version ${v}`;

          if (info.description) {
            result += `\n${info.description}\n `;
          }

          result += `## Versions\n\nlatest package version: ${v}\n`;

          if (latest.homepage) {
            result += `homepage: ${latest.homepage}\n`;
          }

          if (info.readme) {
            result += `\n Here is the readme of ${name}\n---\n${info.readme}`;
          }

          return result;
        } catch (err) {
          logger.error({ err, input }, "Unable to fetch package information");
          return "Error: Unable to fetch package information";
        }
      },
      name: "get_npm_package_info",
      description:
        "Get npm package information for packages other than the current project",
      parameters: zodToJsonSchema(paramSchema) as any,
    },
  };
};
