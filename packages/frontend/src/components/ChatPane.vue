<template>
  <div class="flex flex-col h-full w-full">
    <div class="flex flex-grow w-full overflow-hidden p-2 h-12">
      <div
        class="text-sm flex dark:text-gray-400 hover:dark:text-gray-300 mr-5 cursor-pointer text-nowrap text-ellipsis"
        title="Chat History"
        @click="showHistory"
      >
        <div class="material-icons-outlined w-8 cursor-pointer">history</div>
        Chat History
      </div>
      <div
        class="text-sm flex dark:text-gray-400 hover:dark:text-gray-300 cursor-pointer text-nowrap text-ellipsis"
        title="New Chat"
        @click="showNewChat"
      >
        <div class="material-icons-outlined w-8 cursor-pointer">chat</div>
        New Chat
      </div>
    </div>
    <template v-if="tab === 'chat'">
      <div
        class="flex-grow w-full h-full overflow-y-auto pb-12"
        ref="chatContainer"
      >
        <MessageList :messages="messages" />
        <RobotThinking v-if="isLoading" with="50" height="50" />
      </div>
      <div class="sticky bottom-3 top-3 w-full px-4">
        <ChatInput
          v-model:is-loading="isLoading"
          @send-message="sendMessage"
          @abort="abort"
          ref="chatInput"
        />
      </div>
    </template>
    <template v-else>
      <div
        class="flex-grow w-full h-full overflow-y-auto p-5 flex-col"
        ref="chatHistory"
      >
        <div
          v-for="conversation of conversations"
          :key="conversation.id"
          class="w-full cursor-pointer"
          @click="loadConversation(conversation.id)"
        >
          <div class="w-full font-bold text-gray-200">
            {{ toDateString(conversation.createdAt) }}
          </div>
          <div
            class="ml-5 mb-5 max-h-24 overflow-hidden text-ellipsis dark:text-gray-500 hover:dark:text-gray-400"
          >
            {{ conversation.content }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { fetchEventSource } from '@microsoft/fetch-event-source'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { backbone } from '../backbone/index.js'
import { BaseApi } from '../client/base.js'
import { ChatApi, ConversationHistory } from '../client/index.js'
import { useAuth } from '../store/index.js'
import { ChatMessage, SSEChatMessage } from '../types/chat.js'
import ChatInput from './ChatInput.vue'
import MessageList from './MessageList.vue'
import RobotThinking from './RobotThinking.vue'

dayjs.extend(relativeTime)

const props = defineProps<{
  projectId: string
}>()

const { getTokens } = useAuth()

const chatContainer = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const chatInput = ref<InstanceType<typeof ChatInput.default> | null>(null)
const messages = ref<ChatMessage[]>([])
const conversationId = ref<string | undefined>()
const tab = ref<'chat' | 'history'>('chat')
const conversations = ref<ConversationHistory[]>([])
const chatMessageContext = ref('')

let ctrl: AbortController | null = null

const toDateString = (date: string) => dayjs(date).fromNow()

const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const showHistory = async () => {
  tab.value = tab.value === 'chat' ? 'history' : 'chat'
  conversations.value = await ChatApi.getConversations(props.projectId)
}

const showChat = async () => {
  tab.value = 'chat'
}

const showNewChat = async () => {
  messages.value = []
  conversationId.value = undefined
  await showChat()
}

const loadConversation = async (id: string) => {
  const conversation = await ChatApi.getConversation(props.projectId, id)
  messages.value = conversation.messages
  conversationId.value = conversation.id
  await showChat()
  scrollToBottom()
}

onMounted(async () => {
  chatInput.value?.focus()
  const recentConversation = await ChatApi.getRecentConversation(props.projectId)
  messages.value = recentConversation.messages
  conversationId.value = recentConversation.id
  backbone.on('ask_chat', (event) => {
    chatMessageContext.value = 'The following question relates to your generated code'
    if (event.filename?.length) {
      chatMessageContext.value += ` of file ${event.filename}.`
    }
    chatMessageContext.value += `\n You generated this code\n\n\`\`\`\n${event.code}\n\`\`\``
  })
  scrollToBottom()
})

onBeforeUnmount(() => {
  backbone.off('ask_chat')
})

watch(
  () => messages.value,
  () => {
    nextTick(scrollToBottom)
  },
  { deep: true }
)

const abort = () => {
  if (ctrl) {
    ctrl.abort()
    messages.value.pop()
    messages.value.pop()
  }
  isLoading.value = false
}

const sendMessage = async (input: string) => {
  const content = chatMessageContext.value.length
    ? `${chatMessageContext.value}\n\n${input}`
    : input
  messages.value.push(
    {
      content,
      role: 'user',
    },
    {
      content: '',
      role: 'assistant',
    }
  )

  const msgIndex = messages.value.length - 1

  ctrl = new AbortController()

  const callBackend = async () =>
    await fetchEventSource(`/api/v1/projects/${props.projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: content,
        conversationId: conversationId.value,
      }),
      signal: ctrl?.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getTokens()?.accessToken}`,
      },
      openWhenHidden: true,
      onopen: async (response: Response) => {
        isLoading.value = true
        if (response.ok) {
          return
        }
        if (response.status !== 401) {
          throw new Error('')
        }
        const tok = await BaseApi.refreshTokens()
        if (!tok) {
          throw new Error('')
        }
        await callBackend()
      },
      onerror: (e: Error) => {
        console.log('onerror', e)
        isLoading.value = false
        ctrl = null
        chatMessageContext.value = ''
        throw e
      },
      onclose: () => {
        isLoading.value = false
        ctrl = null
        chatMessageContext.value = ''
      },
      onmessage: async (msg: { data: string }) => {
        const data = JSON.parse(msg.data) as SSEChatMessage

        switch (data.event) {
          case 'token':
            console.log(data.content)
            messages.value[msgIndex].content += data.content
            break
          case 'start':
            isLoading.value = true
            break
          case 'error':
            isLoading.value = false
            console.error('error', data.content)
            break
          case 'info':
            console.log('info', data.content)
            break
          case 'end':
            isLoading.value = false
            break
          default:
            console.log('unknown event', data)
            break
        }
      },
    })

  await callBackend()
  chatMessageContext.value = ''
  chatInput.value?.focus()
}
</script>

<style lang="css">
.prose {
  font-size: 14px !important;
}
</style>
