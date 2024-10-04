<template>
  <div class="flex flex-row sm:px-4">
    <div class="flex-shrink-0 mr-3">
      <div class="text-xl pt-5">
        {{ isUser ? "🤵" : "🤖" }}
      </div>
    </div>
    <div class="flex-grow overflow-x-hidden">
      <div
        v-for="(tool, index) of tools"
        :key="index"
        class="border text-slate-300 dark:text-slate-300 border-slate-500 dark:bg-slate-700 bg-slate-700 rounded p-2 overflow-hidden my-5 flex"
      >
        <div class="material-icons-outlined mr-2">build_circle</div>
        <div class="text-sm">
          <span class="font-semibold">{{ toolToText(tool) }}</span>
          <div dir="rtl" class="text-ellipsis text-left break-keep">
            <span dir="ltr">{{ tool.arguments.path }}</span>
          </div>
        </div>
      </div>
      <VueMarkdown
        :source="message.content"
        :class="isUser ? 'dark:text-gray-400 text-gray-500' : ''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import VueMarkdown from './VueMarkdown.vue'

import { computed } from 'vue'
import type { ChatMessage, ChatMessageToolUsage } from '../types/chat.js'

const props = defineProps<{
  message: ChatMessage
}>()

const { t } = useI18n()

const isUser = computed(() => props.message.role === 'user')
const tools = computed(() => props.message.tools ?? [])

const toolToText = (tool: ChatMessageToolUsage) => {
  switch (tool.name) {
    case 'read_file':
      return t('toolcall.readFile')
    case 'check_if_file_exist':
      return t('toolcall.checkIfFileExists')
    case 'create_directory':
      return t('toolcall.createDirectory')
    case 'fetch_webpage':
      return t('toolcall.fetchWebpage')
    case 'get_folder_file_structure':
      return t('toolcall.getFolderStructure')
    case 'get_npm_package_info':
      return t('toolcall.npmPackageInfo', {
        name: tool.arguments.name,
        version: tool.arguments.version ?? 'latest',
      })
    case 'get_context':
      return t('toolcall.getContext')
    case 'write_file':
      return t('toolcall.writeFile')
    default:
      return t('toolcall.unknownTool')
  }
}
</script>
