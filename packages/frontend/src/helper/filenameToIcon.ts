import { type ManifestConfig, generateManifest } from 'material-icon-theme'

const config: ManifestConfig = {
  activeIconPack: 'vue',
  hidesExplorerArrows: true,
  folders: {
    theme: 'classic',
    associations: {
      conf: 'config',
      confs: 'config',
      config: 'config',
      configs: 'config',
      src: 'src',
      example: 'examples',
      examples: 'examples',
      doc: 'docs',
      docs: 'docs',
      '.vscode': 'vscode',
      '.github': 'github',
      workflows: 'gh-workflow',
      node_modules: 'node',
      tmp: 'temp',
      temp: 'temp',
      test: 'test',
      helper: 'helper',
      misc: 'tools',
      tools: 'tools',
      vendor: 'lib',
      vendors: 'lib',
      lib: 'lib',
      libs: 'lib',
      images: 'images',
      image: 'images',
      img: 'images',
      icons: 'images',
      icon: 'images',
      asset: 'images',
      assets: 'images',
      storybook: 'storybook',
      components: 'components',
    },
  },
  files: {
    associations: {
      '*.ts': 'typescript',
      '*.js': 'javascript',
    },
  },
  languages: {
    associations: {},
  },
}
const iconManifest = generateManifest(config)

export const filenameToIcon = (
  filename: string,
  isDirectory: boolean,
  expanded = false
): string => {
  if (isDirectory) {
    if (!expanded) {
      return iconManifest.folderNamesExpanded?.[filename] ?? iconManifest.folder ?? ''
    }
    return iconManifest.folderNames?.[filename] ?? iconManifest.folderExpanded ?? ''
  }

  if (iconManifest.fileNames?.[filename]) {
    return iconManifest.fileNames?.[filename]
  }

  const fileNameSplitted = filename.split('.')
  if (fileNameSplitted.length > 2) {
    const doubleExt = `${fileNameSplitted[fileNameSplitted.length - 2]}.${
      fileNameSplitted[fileNameSplitted.length - 1]
    }`
    if (iconManifest.fileExtensions?.[doubleExt]) {
      return iconManifest.fileExtensions?.[doubleExt]
    }
  }

  const ext = fileNameSplitted[fileNameSplitted.length - 1]

  return iconManifest.fileExtensions?.[ext] ?? iconManifest.file ?? ''
}
