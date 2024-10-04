import hljs from 'highlight.js/lib/core'
import MarkdownIt, { type Options as MarkdownItOptions } from 'markdown-it'
import MarkdownHighlight from 'markdown-it-highlightjs'
import 'highlight.js/styles/atom-one-dark.css'
import { full as emoji } from 'markdown-it-emoji'
import { codeHeader } from './codeHeader.js'
import { renderHtml } from './renderHtml.js'
import { hljsDefineVue } from './vue.js'

export const useMarkdown = () => {
  let md: MarkdownIt
  return {
    getMd: () => {
      if (md) {
        return md
      }

      const options: MarkdownItOptions = {
        html: true,
      }

      hljs.registerLanguage('vue', hljsDefineVue)

      md = new MarkdownIt(options)

      const plugins = [emoji, codeHeader, renderHtml]

      for (const plugin of plugins) {
        md.use(plugin)
      }

      md.use(MarkdownHighlight, { hljs })

      return md
    },
  }
}
