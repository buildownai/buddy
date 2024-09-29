<template>
    <div class="markdown-content prose dark:prose-invert max-w-full">
        <div v-html="content" class="overscroll-y-auto"></div>
    </div>
</template>

<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import MarkdownIt, { type Options as MarkdownItOptions } from 'markdown-it'
import MarkdownHighlight from 'markdown-it-highlightjs'
import { computed, ref } from 'vue'
import 'highlight.js/styles/atom-one-dark.css'
import { full as emoji } from 'markdown-it-emoji'
import { codeHeader } from './markdown/codeHeader.js'
import { renderHtml } from './markdown/renderHtml.js'
const props = defineProps<{
  source: string
}>()

const options: MarkdownItOptions = {
  html: true,
}

const md = ref<MarkdownIt>(new MarkdownIt(options))

const defaultRender =
  md.value.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))

md.value.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')

  return defaultRender(tokens, idx, options, env, self)
}

const plugins = [emoji, codeHeader, renderHtml]

for (const plugin of plugins) {
  md.value.use(plugin)
  md.value.use(MarkdownHighlight, { hljs })
}

const content = computed(() => md.value.render(props.source))
</script>

<style>
.code-with-header > pre {
  margin:0px !important;
  padding:0px;
  border-radius: 0px;
  background: none;
}

.code-with-header > pre > code {
  border-radius: 0px;
}
</style>
