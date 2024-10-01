import type { ToolEntry } from '../../types/index.js'
import { toolCheckIfFileExist } from './checkIfFileExist.js'
import { toolCreateDirectory } from './createDirectory.js'
import { toolFetchWebpage } from './fetchWebsite.js'
import { toolGetFolderStructure } from './folderStructure.js'
import { getNpmPackageInfo } from './getNpmPackageInfo.js'
import { knowledgeBase } from './knowledgeBase.js'
import { toolReadFile } from './readFile.js'
import { toolStepAgent } from './stepAgent.js'
import { toolWriteFile } from './writeFile.js'

const availableFunctions = new Map<string, ToolEntry>()

availableFunctions.set(toolReadFile.schema.function.name, toolReadFile)
availableFunctions.set(toolWriteFile.schema.function.name, toolWriteFile)
availableFunctions.set(toolCheckIfFileExist.schema.function.name, toolCheckIfFileExist)
availableFunctions.set(toolGetFolderStructure.schema.function.name, toolGetFolderStructure)

availableFunctions.set(toolCreateDirectory.schema.function.name, toolCreateDirectory)

availableFunctions.set(knowledgeBase.schema.function.name, knowledgeBase)
availableFunctions.set(getNpmPackageInfo.schema.function.name, getNpmPackageInfo)
availableFunctions.set(toolFetchWebpage.schema.function.name, toolFetchWebpage)
availableFunctions.set(toolStepAgent.schema.function.name, toolStepAgent)
const tools = Array.from(availableFunctions.entries()).map(([name, { schema }]) => schema)

export { availableFunctions, tools }
