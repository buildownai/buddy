<template>
  <div class="w-full h-full">
    <div
      class="flex border-b border-gray-300 dark:border-gray-700 overflow-x-auto bg-neutral-100 dark:bg-neutral-800"
    >
      <div
        v-for="tab in tabs"
        :key="tab.path"
        :title="tab.path"
        class="px-2 py-2 text-sm font-medium flex border-r dark:border-r-gray-700"
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
          class="w-5 h-5 mr-1"
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
    <CodeEditor
      v-if="activeTab"
      :file-name="activeTab.path"
      :project-id="projectId"
    />
  </div>
</template>

<script setup lang="ts">
type TabEntry = {
  name: string;
  path: string;
};

import { onBeforeMount, onMounted, ref, onBeforeUnmount } from "vue";
import { filenameToIcon } from "../helper/filenameToIcon.js";
import { createBrowserEnv } from "../store/browserEnv.js";
import { removeState, createState, hasState } from "../store/editorStates.js";
import CodeEditor from "./CodeEditor.vue";
import { ProjectApi } from "../client/project.js";

const props = defineProps<{
  projectId: string;
}>();

// Define tabs
const tabs = ref<TabEntry[]>([]);

onBeforeMount(async () => {
  await createBrowserEnv(props.projectId);
});

onBeforeUnmount(() => {
  window.backbone.off("apply_code_to_file");
  window.backbone.off("open_file");
});

onMounted(() => {
  window.backbone.on("open_file", async (event) => {
    const path = event.path;
    const s = path.split("/");
    const name = s[s.length - 1];
    if (hasState(props.projectId, path)) {
      setActiveTab(path, name);
      return;
    }
    ProjectApi.getFile(props.projectId, path)
      .then((content) => {
        createState(props.projectId, path, content);
        setActiveTab(path, name);
        // add merge function
      })
      .catch((err) => {
        createState(props.projectId, path, event.code);
        setActiveTab(path, name);
      });
  });

  window.backbone.on("apply_code_to_file", async (event) => {
    const path = event.filename;
    const s = path.split("/");
    const name = s[s.length - 1];
    if (hasState(props.projectId, path)) {
      setActiveTab(path, name);
      // add merge function
      return;
    }
    ProjectApi.getFile(props.projectId, path)
      .then((content) => {
        createState(props.projectId, path, content);
        setActiveTab(path, name);
        // add merge function
      })
      .catch((err) => {
        createState(props.projectId, path, event.code);
        setActiveTab(path, name);
      });
  });
});

// State for the active tab
const activeTab = ref<TabEntry | undefined>();

const closeActiveTab = (path: string) => {
  let currentIndex = 0;
  tabs.value = tabs.value.filter((tab, index) => {
    const isMatching = tab.path !== path;
    if (isMatching) {
      currentIndex = index;
      removeState(props.projectId, path);
    }
    return isMatching;
  });

  if (tabs.value.length - 1 < currentIndex) {
    currentIndex = tabs.value.length - 1;
  }

  if (currentIndex < 0) {
    activeTab.value = undefined;
  } else {
    setActiveTab(tabs.value[currentIndex].path, tabs.value[currentIndex].name);
  }
};

// Method to set the active tab
const setActiveTab = async (path: string, name: string) => {
  let existing = tabs.value.find((tab) => tab.path === path);
  if (!existing) {
    existing = { name, path };
    tabs.value.push(existing);
  }
  activeTab.value = existing;
};

defineExpose({
  setActiveTab,
});
</script>
