<template>
  <div>
    <div ref="editor"></div>
  </div>
</template>

<script setup lang="ts">
import { MergeView, unifiedMergeView } from '@codemirror/merge'
import { EditorView } from '@codemirror/view'
import { onMounted, ref } from 'vue'

const editor = ref<HTMLElement | null>(null)

const original = `Hello
World
Welcome`

const doc = `Hello
World
Welcome to new World`

onMounted(async () => {
  let view = new EditorView({
    doc: doc,
    extensions: [
      // basicSetup,
      //EditorView.editable.of(false),
      //EditorState.readOnly.of(true),
      unifiedMergeView({ original }),
    ],
    parent: editor.value,
  })
})
</script>
