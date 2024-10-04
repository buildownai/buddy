<template>
  <div class="markdown-content prose dark:prose-invert max-w-full">
    <div v-html="content" class="overscroll-y-auto"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdown } from './markdown/md.js'

const { getMd } = useMarkdown()

const props = defineProps<{
  source: string
}>()

const content = computed(() => getMd().render(props.source))
</script>

<style>
.code-with-header > pre {
  margin: 0px !important;
  padding: 0px;
  border-radius: 0px;
  background: none;
}

.code-with-header > pre > code {
  border-radius: 0px;
}
</style>
