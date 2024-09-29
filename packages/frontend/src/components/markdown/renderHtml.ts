import type { PluginSimple, Renderer } from 'markdown-it'

const renderHtmlFn = (_origRule?: Renderer.RenderRule): Renderer.RenderRule => {
  return (...args) => {
    const [tokens, idx] = args
    const content = tokens[idx].content

    const openTag = `<div class="border border-neutral-500 dark:bg-neutral-700 bg-neutral-200 rounded p-2 text-sm overflow-hidden">
    <div class="pb-5 underline"><strong>My Thoughts:</strong></div>
    <div>`

    return content.replace('<Thoughts>', openTag).replace('</Thoughts>', '</div></div>')
  }
}

export const renderHtml: PluginSimple = (md) => {
  md.renderer.rules.html_block = renderHtmlFn(md.renderer.rules.html_block)
  md.renderer.rules.html_inline = renderHtmlFn(md.renderer.rules.html_inline)
}
