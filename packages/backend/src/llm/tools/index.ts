import { toolCheckIfFileExist } from "./checkIfFileExist.js";
import { toolCreateDirectory } from "./createDirectory.js";
import { toolFetchWebpage } from "./fetchWebsite.js";
import { toolGetFolderStructure } from "./folderStructure.js";
import { getNpmPackageInfo } from "./getNpmPackageInfo.js";
import { knowledgeBase } from "./knowledgeBase.js";
import { toolReadFile } from "./readFile.js";
//import { toolStepAgent } from "./stepAgent.js";
//import { toolWriteFile } from './writeFile.js'

const tools = [
  toolReadFile,
  toolCheckIfFileExist,
  toolGetFolderStructure,
  toolCreateDirectory,
  toolCreateDirectory,
  knowledgeBase,
  getNpmPackageInfo,
  toolFetchWebpage,
  //toolStepAgent,
];

export { tools };
