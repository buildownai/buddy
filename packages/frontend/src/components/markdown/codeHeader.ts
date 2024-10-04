import type { PluginSimple, Renderer } from 'markdown-it'
import { useI18n } from 'vue-i18n'

const extractFileNameRegex = /\[(.*)\]/

const renderCode = (origRule: Renderer.RenderRule): Renderer.RenderRule => {
  const { t } = useI18n()

  return (...args) => {
    const [tokens, idx] = args
    const content = tokens[idx].content.replaceAll('"', '&quot;').replaceAll("'", '&apos;')
    const origRendered = origRule(...args)

    if (content.length === 0) return origRendered

    const info = tokens[idx].info?.trim() ?? ''
    const match = info.match(extractFileNameRegex)
    const filePath = match ? match[1] : ''

    let header = `
<div class="code-with-header border border-neutral-500 rounded overflow-hidden">
  <div class=" bg-neutral-800 border-b border-neutral-500 flex text-xs text-neutral-400 dark:text-neutral-400 .md-code-header" data-clipboard-text="${content}">
      <div dir="rtl" class="p-2 text-xs flex-grow text-ellipsis overflow-hidden text-end" title="${filePath}"><span dir="ltr">${filePath}</span></div>
      <div class="cursor-pointer hover:text-neutral-200 dark:hover:text-neutral-200 flex border-l border-neutral-500 pl-2 hover:bg-neutral-500 flex" title="Copy to clipboard"  onClick="copyToClipBoard(this)">
        <div class="pt-2">${t('md.codebox.btn.copyToCLipboard')}</div>
        <div class="material-icons-outlined pt-2 pl-1 w-7 text-sm">copy_clipboard</div>
      </div>
      <div class="cursor-pointer hover:text-neutral-200 dark:hover:text-neutral-200 flex border-l border-neutral-500 pl-2 pr-2 hover:bg-neutral-500 flex" title="Ask AI for this code"  onClick="askChat(this,'${filePath}')">
        <div class="pt-2">${t('md.codebox.btn.ask')}</div>
        <div class="material-icons-outlined pt-1 pl-1 w-7">reply</div>
      </div>`

    if (filePath.trim().length) {
      header += `<div class="cursor-pointer hover:text-neutral-200 dark:hover:text-neutral-200 flex border-l border-neutral-500 pl-2 hover:bg-neutral-500 flex" title="Apply code to your code base"  onClick="applyCode(this,'${filePath}')">
        <div class="pt-2">${t('md.codebox.btn.apply')}</div>
        <div class="material-icons-outlined pt-1 w-7">play_arrow</div>
      </div>`
    }

    header += `
    </div>
	${origRendered}
</div>
`
    return header
  }
}

export const codeHeader: PluginSimple = (md) => {
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  md.renderer.rules.code_block = renderCode(md.renderer.rules.code_block!)
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  md.renderer.rules.fence = renderCode(md.renderer.rules.fence!)
}
