<template>
  <div
    class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md w-full overflow-y-auto"
    style="height: calc(100% - 45px)"
  >
    <div ref="editor"></div>
  </div>
</template>
<script lang="ts" setup>
import { getChunks, unifiedMergeView } from "@codemirror/merge";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  createExtensions,
  getMergeState,
  getState,
  removeMergeState,
  setMergeState,
  themeCompartment,
  updateState,
} from "../store/editorStates.js";
import { useTheme } from "../store/index.js";

const editor = ref<HTMLElement | null>(null);

const props = defineProps<{
  fileName: string;
  projectId: string;
}>();

const { isDarkmode } = useTheme();

let view: EditorView;

onMounted(async () => {
  const state = await getState(props.projectId, props.fileName);
  view = new EditorView({
    parent: editor.value as HTMLElement,
    state,
  });
});

onBeforeUnmount(() => {
  view?.destroy();
});

watch(
  () => props.fileName,
  async (current, prev) => {
    // remember current editor state before switching to a other state
    if (view) {
      updateState(props.projectId, prev, view.state);
    }

    const state = await getState(props.projectId, current);
    if (state) {
      view?.setState(state);
    }
  }
);

watch(isDarkmode, () => {
  const newTheme = isDarkmode() ? oneDark : [];
  view.dispatch({
    effects: themeCompartment.reconfigure(newTheme),
  });
});

function appendCode(insert: string) {
  view.dispatch({
    changes: { from: view.state.doc.length, insert },
  });
}

function replaceCode(insert: string) {
  view.dispatch({
    changes: {
      from: 0,
      to:
        view.state.doc.length >= insert.length
          ? insert.length
          : view.state.doc.length,
      insert,
    },
  });
}

async function switchToMergeView() {
  const original = view.state.doc.toString();
  await setMergeState(props.projectId, props.fileName, view.state);

  const extensions = await createExtensions(
    props.projectId,
    props.fileName,
    false
  );

  const newState = EditorState.create({
    doc: "___",
    extensions: [
      ...extensions,
      EditorView.updateListener.of(async (update) => {
        if (update.transactions) {
          for (const tr of update.transactions) {
            if (tr.isUserEvent("accept")) {
              console.log("accepted");
            } else if (tr.isUserEvent("revert")) {
              console.log("revert");
            }
            const chunks = getChunks(tr.state);
            if (chunks?.chunks.length === 0) {
              await switchToEditView();
            }
          }
          view?.focus();
        }
      }),
      unifiedMergeView({
        original,
        highlightChanges: true,
        gutter: true,
        mergeControls: true,
      }),
    ],
  });

  view?.setState(newState);
}

async function switchToEditView() {
  const newContent = view.state.doc.toString();

  const state = await getMergeState(props.projectId, props.fileName);
  if (!state) {
    return;
  }
  await removeMergeState(props.projectId, props.fileName);
  await updateState(props.projectId, props.fileName, state);

  view.setState(state);
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: newContent },
  });
}

async function abortMergeView() {
  const state = await getMergeState(props.projectId, props.fileName);
  if (state) {
    view.setState(state);
    await updateState(props.projectId, props.fileName, state);
    await removeMergeState(props.projectId, props.fileName);
  }
}

defineExpose({
  appendCode,
  replaceCode,
  switchToMergeView,
  switchToEditView,
  abortMergeView,
});
</script>

<style>
.cm-editor {
  height: 100%; /* Force CodeMirror to take full height */
  display: flex;
  flex-direction: column;
}

.cm-chunkButtons {
  right: 60px !important;
}

.cm-deletedChunk button[name="accept"] {
  padding: 3px;
  padding-left: 20px;
  padding-right: 5px;
}
.cm-deletedChunk button[name="reject"] {
  padding: 3px;
  padding-left: 20px;
  padding-right: 5px;
}
</style>
