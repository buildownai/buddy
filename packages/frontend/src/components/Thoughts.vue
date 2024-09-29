<template>
    <blockquote class="p-4 my-4 border-s-4 border-gray-300 bg-gray-50 dark:border-gray-500 dark:bg-gray-800">
        <div><strong>Thoughts:</strong></div>
        <VueMarkdown :source="slotContent" />
    </blockquote>
</template>

<script setup lang="ts">
import { onMounted, ref, useSlots } from 'vue'
import VueMarkdown from './VueMarkdown.vue'

const slotContent = ref('')
const slots = useSlots()

onMounted(() => {
  if (slots.default) {
    slotContent.value = slots
      .default()
      .map((node) => {
        if (typeof node.children === 'string') {
          return node.children
        }
        return ''
      })
      .join('')
  }
})
</script>