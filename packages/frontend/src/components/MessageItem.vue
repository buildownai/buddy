<template>
    <div class="flex flex-row sm:px-4">
      <div class="flex-shrink-0 mr-3">
        <div class="text-xl pt-5">{{ isUser ? '🤵' : '🤖' }}</div>
      </div>
      <div class="flex-grow overflow-x-hidden">
        <VueMarkdown :source="message.content" />
      </div>
    </div>
</template>

<script setup lang="ts">
import VueMarkdown from './VueMarkdown.vue'

import { computed } from 'vue'
import type { ChatMessage } from '../types/chat.js'

const props = defineProps<{
  message: ChatMessage
}>()

const isUser = computed(() => props.message.role === 'user')
</script>
