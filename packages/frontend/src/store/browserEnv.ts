import { fetchEventSource } from "@microsoft/fetch-event-source";
import {
  type VirtualTypeScriptEnvironment,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import ts, { type CompilerOptions } from "typescript";
import { useAuth } from "./index.js";

export let env: VirtualTypeScriptEnvironment;
export let system: ts.System;

export const compilerOptions: CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  allowJs: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  strict: true,
  types: ["node", "bun-types"],
};

const loadFilesFromBackend = async (
  projectId: string,
  fsMap: Map<string, string>
) => {
  const { getTokens } = useAuth();
  await fetchEventSource(`/api/v1/projects/${projectId}/filestream`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getTokens()?.accessToken}`,
    },
    openWhenHidden: true,
    onopen: async (response: Response) => {
      if (response.ok) {
        return;
      }
      throw new Error("Failed to load");
    },
    onerror: (e: Error) => {
      console.log("onerror", e);
      throw e;
    },
    onclose: () => {
      console.log("closed");
    },
    onmessage: async (msg: { data: string }) => {
      const { path, content } = JSON.parse(msg.data) as {
        path: string;
        content: string;
      };
      fsMap.set(path, content);
    },
  });
};

export const createBrowserEnv = async (projectId: string) => {
  const fsMap = new Map<string, string>();

  await loadFilesFromBackend(projectId, fsMap);

  system = createSystem(fsMap);
};

export const getBrowserEnv = (path: string) =>
  createVirtualTypeScriptEnvironment(system, [], ts, compilerOptions);
