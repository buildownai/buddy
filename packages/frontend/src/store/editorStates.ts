import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { less } from '@codemirror/lang-less'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { vue } from '@codemirror/lang-vue'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { Compartment, EditorState, type Extension, Prec } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'
import {
  type HoverInfo,
  tsAutocomplete,
  tsFacet,
  tsHover,
  tsLinter,
  tsSync,
} from '@valtown/codemirror-ts'
import { inlineCopilot } from 'codemirror-copilot'
import { backbone } from '../backbone/index.js'
import { ChatApi } from '../client/index.js'
import { getBrowserEnv } from './browserEnv.js'
import { useTheme } from './index.js'

const editorStates = new Map<string, EditorState>()

const getLanguageFromPath = (path: string) => {
  const splitted = path.split('.')
  const lng = splitted[splitted.length - 1]

  if (['ts', 'tsx', '.cts', '.mts', 'js', 'cjs', 'mjs'].includes(lng)) {
    return {
      modules: [javascript({ typescript: true, jsx: true })],
      lng: 'typescript',
    }
  }

  switch (lng) {
    case 'js':
      return { modules: [javascript({ jsx: true })], lng: 'javascript' }
    case 'mjs':
      return { modules: [javascript({ jsx: true })], lng: 'javascript' }
    case 'cjs':
      return { modules: [javascript({ jsx: true })], lng: 'javascript' }
    case 'jsx':
      return { modules: [javascript({ jsx: true })], lng: 'jsx' }
    case 'ts':
      return {
        modules: [javascript({ jsx: true, typescript: true })],
        lng: 'typescript',
      }
    case 'tsx':
      return {
        modules: [javascript({ jsx: true, typescript: true })],
        lng: 'typescript',
      }
    case 'mts':
      return {
        modules: [javascript({ jsx: true, typescript: true })],
        lng: 'typescript',
      }
    case 'cts':
      return {
        modules: [javascript({ jsx: true, typescript: true })],
        lng: 'typescript',
      }
    case 'md':
      return { modules: [markdown()], lng: 'markdown' }
    case 'css':
      return { modules: [css()], lng: 'css' }
    case 'vue':
      return {
        modules: [vue(), javascript({ jsx: true }), css(), html()],
        lng: 'vue',
      }
    case 'less':
      return { modules: [less()], lng: 'less' }
    case 'yaml':
      return { modules: [yaml()], lng: 'yaml' }
    case 'xml':
      return { modules: [xml()], lng: 'xml' }
    case 'html':
      return { modules: [html()], lng: 'html' }
    case 'sql':
      return { modules: [sql()], lng: 'sql' }
    case 'json':
      return { modules: [json()], lng: 'json' }
    default:
      return {
        modules: [javascript({ jsx: true, typescript: true })],
        lng: 'typescript',
      }
  }
}

export const themeCompartment = new Compartment()

export const updateState = async (projectId: string, path: string, state: EditorState) => {
  editorStates.set(`${projectId}-${path}`, state)
}

export const hasState = (projectId: string, path: string) =>
  editorStates.has(`${projectId}-${path}`)

export const getState = async (projectId: string, path: string) => {
  const s = editorStates.get(`${projectId}-${path}`)
  if (s) {
    return s
  }
}

export const createState = async (projectId: string, path: string, doc: string) => {
  const language = getLanguageFromPath(path)

  const { isDarkmode } = useTheme()

  const extensions: Extension[] = [
    themeCompartment.of(isDarkmode() ? oneDark : []),
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    Prec.highest(
      keymap.of([
        {
          key: 'Ctrl-s',
          mac: 'Cmd-s',
          run: (editor) => {
            backbone.emit('save_file', {
              code: editor.state.doc.toString(),
              filename: path,
            })
            return true
          },
        },
      ])
    ),
    keymap.of([indentWithTab]),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    inlineCopilot(async (prefix, suffix) => {
      const result = await ChatApi.getCompletion(projectId, prefix, suffix, language.lng)
      const prediction = result
      return prediction
    }),
    ...language.modules,
  ]

  if (language.lng === 'typescript') {
    extensions.push(
      tsFacet.of({ env: getBrowserEnv(path), path: path }),
      tsSync(),
      tsLinter(),
      autocompletion({
        override: [tsAutocomplete()],
      }),
      tsHover({
        renderTooltip: (info: HoverInfo) => {
          const div = document.createElement('div')
          if (info.quickInfo?.displayParts) {
            for (const part of info.quickInfo.displayParts) {
              const span = div.appendChild(document.createElement('span'))
              span.className = `quick-info-${part.kind}`
              span.innerText = part.text
            }
          }
          return { dom: div }
        },
      })
    )
  }

  const state = EditorState.create({
    doc,
    extensions,
  })

  editorStates.set(`${projectId}-${path}`, state)
  return state
}

export const removeState = (projectId: string, path: string) =>
  editorStates.delete(`${projectId}-${path}`)
