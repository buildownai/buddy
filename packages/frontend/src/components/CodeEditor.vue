<template>
  <div class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md w-full overflow-y-auto" style="height:calc(100% - 45px)">
  <div ref="editor" ></div>
  </div>
</template>
<script lang="ts" setup>
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getState, themeCompartment, updateState } from '../store/editorStates.js'
import { useTheme } from '../store/index.js'

const editor = ref<HTMLElement | null>(null)

const props = defineProps<{
  fileName: string
  projectId: string
}>()

const { isDarkmode } = useTheme()

let view: EditorView

onMounted(async () => {
  const state = await getState(props.projectId, props.fileName)
  view = new EditorView({
    parent: editor.value as HTMLElement,
    state,
  })
})

onBeforeUnmount(() => {
  view?.destroy()
})

watch(
  () => props.fileName,
  async (current, prev) => {
    if (view) {
      updateState(props.projectId, prev, view.state)
    }

    const state = await getState(props.projectId, current)
    view?.setState(state)
  }
)

watch(isDarkmode, () => {
  const newTheme = isDarkmode() ? oneDark : []
  view.dispatch({
    effects: themeCompartment.reconfigure(newTheme),
  })
})

function appendCode(insert: string) {
  view.dispatch({
    changes: { from: view.state.doc.length, insert },
  })
}

defineExpose({ appendCode })
</script>


<style>
.cm-editor {
  height: 100%; /* Force CodeMirror to take full height */
  display: flex;
  flex-direction: column;
}
</style>