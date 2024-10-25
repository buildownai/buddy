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
  //esModuleInterop: true,
  resolveJsonModule: true,
  strict: true,
  types: ["node"],
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
      console.error("onerror", e);
      throw e;
    },
    onclose: () => {
      for (const [key, value] of fsMap.entries()) {
        if (key.startsWith("/node_modules/typescript/lib/")) {
          const s = key.split("/");
          fsMap.set(`/${s[s.length - 1]}`, value);
        }
      }
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

export const getBrowserEnv = (path: string) => {
  env = createVirtualTypeScriptEnvironment(system, [path], ts, compilerOptions);
  return env;
};

export const putFile = (path: string, content: string) => {
  system?.writeFile(path, content);
  if (env) {
    if (env.getSourceFile(path)) {
      env.updateFile(path, content);
    } else {
      const s = path.split(".");
      if (
        [
          "ts",
          "js",
          "tsx",
          "jsx",
          "css",
          "json",
          "cjm",
          "mjs",
          "cts",
          "mts",
          "vue",
          "svelte",
          "astro",
        ].includes(s[s.length - 1])
      )
        env.createFile(path, content);
    }
  }
};

export const deleteFile = (path: string) => {
  system?.deleteFile?.(path);
  if (env) {
    if (env.getSourceFile(path)) {
      env.deleteFile(path);
    }
  }
};

export const renameFile = (from: string, to: string) => {
  // TODO: implement rename/move of file
};
