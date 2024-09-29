<template>
  <template v-if="pageReady">
    <div class="flex h-full">
      <div
        class="h-full bg-neutral-300 dark:bg-neutral-950 w-12 min-w-12 relative text-neutral-600 dark:text-neutral-200 small-file-nav overflow-hidden"
      >
        <div class="text-center top-5 flex-row absolute">
          <div class="grow-0">
            <div
              class="material-icons-outlined w-12 h12 cursor-pointer"
              title="Files"
            >
              file_copy
            </div>
          </div>
        </div>
        <div class="text-center bottom-5 flex-row absolute">
          <div class="grow-0 mb-3">
            <div
              class="material-icons-outlined w-12 h12 cursor-pointer"
              title="Switch Theme"
              @click="toggleDarkmode"
            >
              {{ isDarkmode() ? "light_mode" : "dark_mode" }}
            </div>
          </div>
          <div class="grow-0">
            <div
              class="material-icons-outlined w-12 h12 cursor-pointer"
              title="Logout"
              @click="logout"
            >
              logout
            </div>
          </div>
        </div>
        <div
          class="h-full w-96 absolute top-0 bottom-0 small-file-nav-inner z-10 bg-neutral-200 dark:bg-neutral-900 hidden left-11 overflow-y-auto"
        >
          <div class="text-neutral-700 dark:text-neutral-400 w-full m-1 ml-5">
            <div
              class="material-icons-outlined mr-2 cursor-pointer"
              title="Add New File"
            >
              note_add
            </div>
            <div
              class="material-icons-outlined mr-2 cursor-pointer"
              title="Add new Folder"
            >
              create_new_folder
            </div>
            <div
              class="material-icons-outlined mr-2 cursor-pointer"
              title="Refresh"
              @click="loadTree"
            >
              autorenew
            </div>
          </div>
          <Vue3TreeView
            :items="files"
            :isCheckable="false"
            :hideGuideLines="true"
            @onSelect="handleSelectFile"
            class="flex-grow w-full overflow-y-auto text-neutral-700 dark:text-neutral-300 whitespace-nowrap ml-2 mt-2"
          >
            <template v-slot:item-prepend-icon="treeViewItem">
              <div class="w-5 h-5">
                <img
                  :src="`/icons/${filenameToIcon(
                    treeViewItem.name,
                    treeViewItem.meta.isDirectory,
                    treeViewItem.expanded
                  )}.svg`"
                  class="w-5 h-5"
                />
              </div>
            </template>
          </Vue3TreeView>
        </div>
      </div>
      <Splitpanes :push-other-panes="false" size="40">
        <Pane
          class="flex flex-col h-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        >
          <ChatPane :project-id="projectId" />
          <!--
        <div class="flex-grow w-full overflow-y-auto pb-16" ref="chatContainer">
          <MessageList :messages="messages" />

        </div>
        <div class="sticky bottom-3 top-3 w-full px-4">
          <ChatInput
            v-model:is-loading="isLoading"
            @send-message="sendMessage"
            @abort="abort"
            ref="chatInput"
          />
        </div>
        -->
        </Pane>

        <Pane class="overflow-hidden" size="60">
          <FilesContainer :project-id="projectId" />
        </Pane>
      </Splitpanes>
    </div>
  </template>
  <template v-else>
    <div class="flex items-center justify-center h-screen">
      <div
        class="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-3xl"
      >
        <LoaderAnimation />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Vue3TreeView from "vue3-tree-vue";
import ChatPane from "../components/ChatPane.vue";
import FilesContainer from "../components/FilesContainer.vue";
import LoaderAnimation from "../components/LoaderAnimation.vue";
import { filenameToIcon } from "../helper/filenameToIcon.js";
import { useAuth } from "../store/index.js";

import { Pane, Splitpanes } from "splitpanes";
import { useRouter } from "vue-router";
import { AuthApi, ProjectApi } from "../client/index.js";
import { useTheme } from "../store/index.js";
import type { TreeViewItem } from "../types/file.js";

const props = defineProps<{
  projectId: string;
}>();

const { getTokens } = useAuth();
const router = useRouter();
const { toggleDarkmode, isDarkmode } = useTheme();

const logout = async () => {
  try {
    await AuthApi.logout();
    router.push("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const pageReady = ref(false);

const files = ref<TreeViewItem[]>([]);

const loadTree = async () => {
  files.value = await ProjectApi.getProjectFileTree(props.projectId);
};

onMounted(async () => {
  await loadTree();
  pageReady.value = true;
});

const handleSelectFile = async (item: TreeViewItem) => {
  if (item.meta.isDirectory) {
    item.expanded = !item.expanded;
    return;
  }
  window.backbone.emit("open_file", { path: item.meta.path });
};

const handleMoveFile = async (oldPath: string, newPath: string) => {
  // Implement your file moving logic here
  console.log(`Moving file from ${oldPath} to ${newPath}`);
  // You might want to call an API to perform the actual file move
  // After successful move, you may want to refresh the file tree
};

const handleDeleteFile = async (path: string) => {
  // Implement your file deletion logic here
  console.log(`Deleting file: ${path}`);
  // You might want to call an API to perform the actual file deletion
  // After successful deletion, you may want to refresh the file tree
};
</script>

<style scoped>
.h-full {
  height: 100vh;
}

.small-file-nav {
  border-top: 2px solid #4b5563;
}

.small-file-nav:hover {
  overflow: visible;
}

.small-file-nav:hover > .small-file-nav-inner {
  display: block;
  visibility: visible;
}
</style>

<style>
.splitpanes__pane {
  box-sizing: border-box;
  border-top: 2px solid #4b5563;
  justify-content: center;
  align-items: center;
  display: flex;
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 2px;
  background: #4b5563;
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 2px;
  background: #4b5563;
}
</style>
