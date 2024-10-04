import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { setupTypeAcquisition } from '@typescript/ata'
import { glob } from 'glob'
import type { PackageJson } from 'type-fest'
import ts from 'typescript'
import logger from '../../logger.js'
import type { SendProgress } from '../../types/index.js'

export const fetchDependencyTypes = async (clonePath: string, sendProgress: SendProgress) => {
  let packageJson: PackageJson
  try {
    const packageJsonContent = readFileSync(join(clonePath, 'package.json'), {
      encoding: 'utf8',
    })
    packageJson = JSON.parse(packageJsonContent)
    sendProgress('No package.json found', 0)
  } catch (error) {
    return
  }

  const ata = setupTypeAcquisition({
    projectName: packageJson.name ?? basename(clonePath),
    typescript: ts,
    logger: console,
    delegate: {
      receivedFile: (code: string, path: string) => {
        logger.debug({ path }, 'received types file')
      },
      started: () => {
        logger.debug('ATA start')
        sendProgress('Fetching typescript types', 0)
      },
      progress: (downloaded: number, total: number) => {
        const progress = Math.round((downloaded / total) * 100)
        sendProgress(`Fetched ${downloaded} of ${total} dependencies`, progress)
      },
      errorMessage: (msg, err) => {
        logger.error({ err }, msg)
      },
      finished: (vfs) => {
        logger.debug('ATA done')
        sendProgress('Typescript types fetched', 100)
        vfs.forEach((value, key) => {
          const fileName = join(clonePath, key)
          const dir = dirname(fileName)

          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
          }
          writeFileSync(fileName, value)
        })
      },
    },
  })

  const getSrcFileContent = (pkg: PackageJson) => {
    let src = ''

    let x = 0
    if (pkg.dependencies) {
      for (const dependency in pkg.dependencies) {
        src += `import a${x} from '${dependency}'\n`
        x++

        if (dependency === '@types/bun') {
          src += `import a${x} from 'bun-types'\n`
          x++
        }
      }
    }

    if (pkg.devDependencies) {
      for (const devDependency in pkg.devDependencies) {
        src += `import a${x} from '${devDependency}'\n`
        x++

        if (devDependency === '@types/bun') {
          src += `import a${x} from 'bun-types'\n`
          x++
        }
      }
    }

    return src
  }

  let srcContent = getSrcFileContent(packageJson)

  const processWorkspacePackages = (workspaces: string[]) => {
    let src = '\n'
    for (const workspace of workspaces) {
      const workspacePaths = glob.sync(workspace, { cwd: clonePath })

      for (const workspacePath of workspacePaths) {
        const workspacePackageJson = JSON.parse(
          readFileSync(join(clonePath, workspacePath, 'package.json'), {
            encoding: 'utf-8',
          })
        )

        if (workspacePackageJson) {
          src += getSrcFileContent(workspacePackageJson)
        }
      }
    }
    return src
  }

  srcContent += processWorkspacePackages((packageJson.workspaces as string[]) ?? [])

  await ata(srcContent)
}
