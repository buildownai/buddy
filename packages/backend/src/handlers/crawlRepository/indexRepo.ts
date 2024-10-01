import { readFileSync, readdirSync, statSync } from 'node:fs'
import path, { extname, join } from 'node:path'
import { RecordId } from 'surrealdb'
import { config } from '../../config.js'
import { getDb } from '../../db.js'
import { codeFileExtension } from '../../defaults/codeFileExtensions.js'
import { generateSrcFileDescription } from '../../llm/index.js'
import logger from '../../logger.js'
import { knowledgeRepository } from '../../repository/knowledge.js'
import {
  type CodeDescriptionKnowledge,
  KnowledgeType,
  type SendProgress,
} from '../../types/index.js'

async function persistChunk(chunks: CodeDescriptionKnowledge | CodeDescriptionKnowledge[]) {
  try {
    const db = await getDb()
    await db.insert('knowledge', chunks)
  } catch (err) {
    logger.error({ err, chunks }, 'Failed to write chunks')
  }
}

const getLanguageFromFileName = (file: string) => {
  const ext = extname(file)

  switch (ext) {
    case '.js':
      return 'js'
    case '.jsx':
      return 'js'
    case '.cjs':
      return 'js'
    case '.mjs':
      return 'js'
    case '.ts':
      return 'js'
    case '.tsx':
      return 'js'
    case '.cts':
      return 'js'
    case '.mts':
      return 'js'
    default:
      return undefined
  }
}

export const generateCodeDocVectors = async (projectId: string) => {
  const rootDir = join(config.tempDir, projectId)

  const walkDirectory = async (dir: string, parentPath: string) => {
    const currentDir = join(parentPath, dir)
    const absolutePathBase = join(rootDir, currentDir)
    const files = readdirSync(absolutePathBase)

    for (const file of files) {
      if (['.git', 'node_modules', '.DS_Store', '.zed', '.vscode'].includes(file)) {
        continue
      }
      const absolutePath = join(absolutePathBase, file)
      const relativePath = join(currentDir, file)

      const stat = statSync(absolutePath)
      if (stat.isDirectory()) {
        await walkDirectory(file, currentDir)
      } else {
        logger.debug({ relativePath }, 'Indexing file')

        // index only source files
        if (codeFileExtension.includes(extname(file))) {
          const s = file.split('.')
          if (s.length >= 3) {
            // skip indexing of test files (.spec.* and .test.*)
            if (['spec', 'test'].includes(s[s.length - 2].trim().toLowerCase())) {
              continue
            }
          }

          const sourceCode = readFileSync(absolutePath).toString('utf-8')
          const pageContent = await generateSrcFileDescription(sourceCode, relativePath)

          await knowledgeRepository.addKnowledge({
            kind: KnowledgeType.CODE_DESCRIPTION,
            pageContent,
            project: new RecordId('project', projectId),
            file: `/${relativePath}`,
          })
        }
      }
    }
  }

  await walkDirectory('', '')
}

export const indexRepo = async (clonePath: string, sendProgress: SendProgress) => {
  try {
    const repoName = path.basename(clonePath)
    const pathSplit = repoName.split('/')

    const projectId = pathSplit[pathSplit.length - 1]

    logger.info(`Start indexing repository: ${repoName}`)
    await sendProgress('Indexing repository', 0)

    await generateCodeDocVectors(projectId, persistChunk)

    await sendProgress('Indexing complete', 100)
    logger.info(`Indexed repository: ${repoName}`)
  } catch (error) {
    logger.error('Error indexing repository:', error)
    throw error
  }
}
