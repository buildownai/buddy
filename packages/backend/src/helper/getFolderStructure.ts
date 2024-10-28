import { readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import { codeFileExtension } from "../defaults/codeFileExtensions.js";
import { ignoredFiles } from "../defaults/ignoredFiles.js";

export const getFolderStructure = (startPath: string) => {
  let folderStructure = "";

  const walk = (dir: string, indent = 0) => {
    const files = readdirSync(dir);

    for (const file of files) {
      if (ignoredFiles.includes(file)) {
        continue;
      }
      const f = join(dir, file);
      const stat = statSync(f);
      if (stat.isDirectory()) {
        folderStructure += `${" ".repeat(indent)}|- ${file} (directory)\n`;
        walk(f, indent + 1);
      } else {
        if (!codeFileExtension.includes(extname(file))) {
          continue;
        }
        folderStructure += `${" ".repeat(indent)}|- ${file} (file)\n`;
      }
    }
  };

  walk(startPath);

  return folderStructure;
};
