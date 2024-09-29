<template>
    <MessageItem
      v-for="(message, index) in messages"
      :key="index"
      :message="message"
    />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { ChatMessage } from '../types/chat.js'
import MessageItem from './MessageItem.vue'

const props = defineProps<{
  messages: ChatMessage[]
}>()

watch(
  () => props.messages,
  (newMessages) => {},
  {
    deep: true,
  }
)
</script>
