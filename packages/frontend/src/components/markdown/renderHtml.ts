import type { PluginSimple, Renderer } from 'markdown-it'
import { useI18n } from 'vue-i18n'

const renderHtmlFn = (_origRule?: Renderer.RenderRule): Renderer.RenderRule => {
  const { t } = useI18n()
  return (...args) => {
    const [tokens, idx] = args
    const content = tokens[idx].content

    const openTag = `<div class="border border-neutral-500 dark:bg-neutral-700 bg-neutral-200 rounded p-2 text-sm overflow-hidden my-5">
    <div class="pb-5 font-semibold">🤔 <span class="underline">${t('md.thoughts.title')}:</span></div>
    <div class="italic font-light">`

    return content.replace('<Thoughts>', openTag).replace('</Thoughts>', '</div></div>')
  }
}

export const renderHtml: PluginSimple = (md) => {
  md.renderer.rules.html_block = renderHtmlFn(md.renderer.rules.html_block)
  md.renderer.rules.html_inline = renderHtmlFn(md.renderer.rules.html_inline)
}
