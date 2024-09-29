import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { RecordId } from 'surrealdb'
import * as ts from 'typescript'
import { config } from '../../config.js'
import type { CodeChunkLocation, CodeChunkRaw, CodeDocument } from '../../types.js'

function extractCodeChunks(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  filePath: string,
  projectId: string
): CodeChunkRaw[] {
  const chunks: CodeChunkRaw[] = []

  const location = getNodeLocation(node, sourceFile)
  if (ts.isFunctionDeclaration(node) && node.name) {
    // Extract function information
    const functionName = node.name.getText()
    const functionBody = node.body ? node.body.getText(sourceFile) : ''

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'FunctionDeclaration',
      name: functionName,
      content: functionBody,
      location,
    })
  } else if (ts.isVariableDeclaration(node) && node.name) {
    // Extract variable declaration
    const variableName = node.name.getText()
    const initializer = node.initializer ? node.initializer.getText(sourceFile) : ''

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'VariableDeclaration',
      name: variableName,
      content: initializer,
      location,
    })
  } else if (ts.isClassDeclaration(node) && node.name) {
    // Extract class declaration
    const className = node.name.getText()
    const classBody = node.members.map((member) => member.getText(sourceFile)).join('\n')

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'ClassDeclaration',
      name: className,
      content: classBody,
      location,
    })
  } else if (ts.isImportDeclaration(node)) {
    // Extract import statement
    const importStatement = node.getText(sourceFile)

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'ImportDeclaration',
      content: importStatement,
      location,
    })
  } else if (ts.isExportDeclaration(node)) {
    // Extract export statement
    const exportStatement = node.getText(sourceFile)

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'ExportDeclaration',
      content: exportStatement,
      location,
    })
  } else if (ts.isInterfaceDeclaration(node)) {
    const interfaceName = node.name.getText()
    const interfaceMembers = node.members.map((member) => member.getText(sourceFile)).join('\n')

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'InterfaceDeclaration',
      name: interfaceName,
      content: interfaceMembers,
      location,
    })
  } else if (ts.isTypeAliasDeclaration(node)) {
    const typeName = node.name.getText()
    const typeContent = node.type.getText(sourceFile)

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'TypeAliasDeclaration',
      name: typeName,
      content: typeContent,
      location,
    })
  } else if (ts.isEnumDeclaration(node)) {
    const enumName = node.name.getText()
    const enumMembers = node.members.map((member) => member.getText(sourceFile)).join('\n')

    chunks.push({
      project: new RecordId('project', projectId),
      filePath,
      type: 'EnumDeclaration',
      name: enumName,
      content: enumMembers,
      location,
    })
  }

  for (const child of node.getChildren()) {
    const children = extractCodeChunks(child, sourceFile, filePath, projectId)
    chunks.push(...children)
  }

  return chunks
}

function getNodeLocation(node: ts.Node, sourceFile: ts.SourceFile): CodeChunkLocation {
  const startPos = node.getStart()
  const endPos = node.getEnd()

  const { line: startLine, character: startChar } =
    sourceFile.getLineAndCharacterOfPosition(startPos)
  const { line: endLine, character: endChar } = sourceFile.getLineAndCharacterOfPosition(endPos)

  return {
    start: {
      line: startLine + 1,
      character: startChar + 1,
      offset: startPos,
    },
    end: {
      line: endLine + 1,
      character: endChar + 1,
      offset: endPos,
    },
  }
}

export const generateVectors = async (
  projectId: string,
  insertChunk: (chunks: CodeChunkRaw[]) => Promise<void>
) => {
  const startDir = join(config.tempDir, projectId)

  const walkDirectory = async (dir: string, basePath = '') => {
    const files = readdirSync(dir)

    for (const file of files) {
      if (['.git', 'node_modules', '.DS_Store'].includes(file)) {
        continue
      }
      const filePath = join(dir, file)
      const relativePath = join(basePath, file)

      const stat = statSync(filePath)
      if (stat.isDirectory()) {
        await walkDirectory(filePath, relativePath)
      } else {
        const fileNameParts = file.split('.')
        const ext = fileNameParts[fileNameParts.length - 1]
        if (!['ts', 'tsx', 'mts', 'cts', 'js', 'cjs', 'mjs'].includes(ext)) {
          continue
        }
        const sourceCode = readFileSync(filePath).toString('utf-8')
        const sourceFile = ts.createSourceFile(
          relativePath,
          sourceCode,
          ts.ScriptTarget.Latest,
          true
        )
        const chunks = await extractCodeChunks(sourceFile, sourceFile, relativePath, projectId)
        await insertChunk(chunks)
      }
    }
  }

  await walkDirectory(startDir)
}

export const generateCodeDocVectors = async (
  projectId: string,
  insertChunk: (docs: CodeDocument[]) => Promise<void>
) => {
  const startDir = join(config.tempDir, projectId)

  const walkDirectory = async (dir: string, basePath = '') => {
    const files = readdirSync(dir)

    const fileBuckets: CodeDocument[] = []
    for (const file of files) {
      if (['.git', 'node_modules', '.DS_Store'].includes(file)) {
        continue
      }
      const filePath = join(dir, file)
      const relativePath = join(basePath, file)

      const stat = statSync(filePath)
      if (stat.isDirectory()) {
        await walkDirectory(filePath, relativePath)
      } else {
        const fileNameParts = file.split('.')
        const ext = fileNameParts[fileNameParts.length - 1]
        if (!['ts', 'tsx', 'mts', 'cts', 'js', 'cjs', 'mjs'].includes(ext)) {
          continue
        }

        const sourceCode = readFileSync(filePath).toString('utf-8')
        fileBuckets.push({
          file: filePath,
          project: new RecordId('project', projectId),
          content: sourceCode,
          embedding: [],
        })
      }
    }
    await insertChunk(fileBuckets)
  }

  await walkDirectory(startDir)
}
