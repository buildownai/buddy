import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { Ollama } from 'ollama'
import { config } from '../config.js'
import { codeFileExtension } from '../defaults/codeFileExtensions.js'
import logger from '../logger.js'

export const generateSystemPromptContext = async (path: string) => {
  const ollama = new Ollama({ host: config.llm.url })

  const system = `Extract all relevant project information to add context for a system prompt for an AI.
The AI should be able to understand the codebase, file structure, workspace setup, type (esm/commonjs).
Add a short and precise description of the project.
Return only the information as plain text without any further explanation or backticks.`

  const rootPackageJson = readFileSync(join(path, 'package.json'), {
    encoding: 'utf8',
  })

  let folderStructure = ''

  const walk = (dir: string, indent = 0) => {
    const files = readdirSync(dir)

    for (const file of files) {
      if (['.git', '.DS_Store', 'node_modules', '.zed', '.vscode'].includes(file)) {
        continue
      }
      const f = join(dir, file)
      const stat = statSync(f)
      if (stat.isDirectory()) {
        folderStructure += `${' '.repeat(indent)}|- ${file} (directory)\n`
        walk(f, indent + 1)
      } else {
        if (!codeFileExtension.includes(extname(file))) {
          continue
        }
        folderStructure += `${' '.repeat(indent)}|- ${file} (file)\n`
      }
    }
  }

  walk(path)

  const prompt = `## /package.json
Here is the content of the file \`/package.json\`

${rootPackageJson}

## File & folder structure
Summerize and generalize the file structure:
${folderStructure}
  `

  const response = await ollama.generate({
    model: config.llm.models.chat,
    system,
    prompt,
    stream: false,
    options: {
      temperature: 0,
    },
  })

  logger.debug({ description: response.response }, 'System description')

  return response.response
}
