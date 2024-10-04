<template>
  <div class="w-full h-full">
    <div
      class="flex border-b border-gray-300 dark:border-gray-700 overflow-x-auto bg-neutral-100 dark:bg-neutral-800"
    >
      <div
        v-for="tab in tabs"
        :key="tab.path"
        :title="tab.path"
        class="pl-2 pr-6 py-2 text-sm font-medium flex border-r dark:border-r-gray-700"
        :class="[
          activeTab?.path === tab.path
            ? 'border-b-2 border-b-blue-500'
            : 'border-b-2 border-b-transparent',
          'transition-all duration-200',
          activeTab?.path === tab.path
            ? 'text-gray-800 dark:text-gray-200'
            : 'text-gray-500 dark:text-gray-400',
          activeTab?.path === tab.path
            ? 'bg-gray-300 dark:bg-gray-700'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600',
        ]"
      >
        <img
          :src="`/icons/${filenameToIcon(tab.name, false, false)}.svg`"
          class="w-15 h-5 mr-1"
        />
        <div
          class="cursor-pointer text-nowrap"
          @click="setActiveTab(tab.path, tab.name)"
        >
          {{ tab.name }}
        </div>
        <div
          class="material-icons-sharp w-4 h-5 ml-1 cursor-pointer text-sm"
          @click="closeActiveTab(tab.path)"
        >
          close
        </div>
      </div>
    </div>
    <template v-if="activeTab">
      <CodeEditor
        :file-name="activeTab.path"
        :project-id="projectId"
        ref="editor"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
type TabEntry = {
  name: string
  path: string
}

import { fetchEventSource } from '@microsoft/fetch-event-source'
import { nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'
import { getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { backbone } from '../backbone/index.js'
import { BaseApi } from '../client/base.js'
import { ProjectApi } from '../client/project.js'
import { filenameToIcon } from '../helper/filenameToIcon.js'
import { createBrowserEnv } from '../store/browserEnv.js'
import { clearStates, createState, getState, hasState, removeState } from '../store/editorStates.js'
import { useAuth } from '../store/index.js'
import { SSEChatMessage } from '../types/chat.js'
import CodeEditor from './CodeEditor.vue'

const { t } = useI18n()
const { proxy } = getCurrentInstance()!

const props = defineProps<{
  projectId: string
}>()

const { getTokens } = useAuth()

// Define tabs
const tabs = ref<TabEntry[]>([])
const editor = ref<typeof CodeEditor | null>(null)

onBeforeMount(async () => {
  await createBrowserEnv(props.projectId)
})

onBeforeUnmount(async () => {
  backbone.off('apply_code_to_file')
  backbone.off('open_file')
  backbone.off('save_file')
  await clearStates()
})

let ctrl: AbortController | null

onMounted(() => {
  backbone.on('open_file', async (event) => {
    const path = event.path
    const s = path.split('/')
    const name = s[s.length - 1]
    if (hasState(props.projectId, path)) {
      setActiveTab(path, name)
      return
    }
    ProjectApi.getFile(props.projectId, path)
      .then((content) => {
        createState(props.projectId, path, content)
        setActiveTab(path, name)
        // add merge function
      })
      .catch((err) => {
        createState(props.projectId, path, 'FAILED TO LOAD')
        setActiveTab(path, name)
      })
  })

  const applyCodeChanges = async (codeToApply: string) => {
    await nextTick()
    await nextTick()
    const state = await getState(props.projectId, activeTab.value?.path!)
    const originalCode = state?.doc.toString()

    ctrl = new AbortController()

    const callBackend = async () =>
      await fetchEventSource(`/api/v1/projects/${props.projectId}/apply-code`, {
        method: 'POST',
        body: JSON.stringify({
          original: originalCode,
          codeToApply,
        }),
        signal: ctrl?.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getTokens()?.accessToken}`,
        },
        openWhenHidden: true,
        onopen: async (response: Response) => {
          if (response.ok) {
            await editor.value?.switchToMergeView()
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
          ctrl = null
          throw e
        },
        onclose: () => {
          ctrl = null
        },
        onmessage: async (msg: { data: string }) => {
          const data = JSON.parse(msg.data) as SSEChatMessage

          switch (data.event) {
            case 'token':
              editor.value?.appendCode(data.content)
              break
            case 'start':
              break
            case 'error':
              console.error('error', data.content)
              break
            case 'end':
              break
            default:
              console.log('unknown event', data)
              break
          }
        },
      })

    await callBackend()
  }

  backbone.on('apply_code_to_file', async (event) => {
    const path = event.filename
    const s = path.split('/')
    const name = s[s.length - 1]
    if (hasState(props.projectId, path)) {
      await setActiveTab(path, name)
      await applyCodeChanges(event.code)
      return
    }
    const content = await ProjectApi.getFile(props.projectId, path).catch(async (err) => {
      const confirmed = await proxy?.$showPopover({
        title: t('dialog.createFile.title'),
        message: t('dialog.createFile.message', { path }),
        yesText: t('dialog.createFile.btn.yes'),
        noText: t('dialog.createFile.btn.no'),
      })

      if (!confirmed) {
        return undefined
      }
      const error = await ProjectApi.putFile(props.projectId, path, event.code).catch((err) => {
        console.error('failed to create')
        return new Error('Failed to create file')
      })

      if (error) {
        return undefined
      }

      createState(props.projectId, path, event.code)
      setActiveTab(path, name)

      return undefined
    })
    if (!content) {
      return
    }
    createState(props.projectId, path, content)
    await setActiveTab(path, name)
    await applyCodeChanges(event.code)
  })

  backbone.on('save_file', async (event) => {
    ProjectApi.putFile(props.projectId, event.filename, event.code).catch((err) => {
      console.error(err, 'Failed to save file')
      alert('Failed to save file')
    })
  })
})

// State for the active tab
const activeTab = ref<TabEntry | undefined>()

const closeActiveTab = async (path: string) => {
  ctrl?.abort('Tab closed')
  await editor.value?.abortMergeView()
  let currentIndex = 0
  tabs.value = tabs.value.filter((tab, index) => {
    const isMatching = tab.path !== path
    if (isMatching) {
      currentIndex = index
      removeState(props.projectId, path)
    }
    return isMatching
  })

  if (tabs.value.length - 1 < currentIndex) {
    currentIndex = tabs.value.length - 1
  }

  if (currentIndex < 0) {
    activeTab.value = undefined
  } else {
    setActiveTab(tabs.value[currentIndex].path, tabs.value[currentIndex].name)
  }
}

// Method to set the active tab
const setActiveTab = async (path: string, name: string) => {
  ctrl?.abort('Tab closed')
  await editor.value?.abortMergeView()
  let existing = tabs.value.find((tab) => tab.path === path)
  if (!existing) {
    existing = { name, path }
    tabs.value.push(existing)
  }
  activeTab.value = existing
}

defineExpose({
  setActiveTab,
})
</script>
