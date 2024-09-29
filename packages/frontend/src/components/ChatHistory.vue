<template>
  <div v-for="conversaion of conversations">
    {{ conversaion.messages[0].content }}
  </div>
</template>
<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { ChatApi } from '../client/chat.js'
import type { Conversation } from '../client/types.js'

const conversations = ref<Conversation[]>([])

const props = defineProps<{
  projectId: string
}>()

onBeforeMount(async () => {
  conversations.value = await ChatApi.getConversations(props.projectId)
})
</script>
