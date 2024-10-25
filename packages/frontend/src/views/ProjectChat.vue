<template>
  <template v-if="pageReady">
    <div class="flex h-full">
      <Splitpanes :push-other-panes="false">
        <Pane
          class="bg-neutral-200 dark:bg-neutral-900 overflow-y-auto"
          size="15"
        >
          <div class="h-full w-full">
            <div class="text-neutral-700 dark:text-neutral-400 w-full m-1 ml-3">
              <div
                class="material-icons-outlined mr-2 cursor-pointer"
                :title="$t('fileTree.btn.newFile')"
              >
                note_add
              </div>
              <div
                class="material-icons-outlined mr-2 cursor-pointer"
                :title="$t('fileTree.btn.newFolder')"
              >
                create_new_folder
              </div>
              <div
                class="material-icons-outlined mr-2 cursor-pointer"
                :title="$t('fileTree.btn.refresh')"
                @click="loadTree"
              >
                autorenew
              </div>
            </div>
            <div
              class="h-full pb-24 flex-grow w-full overflow-auto text-neutral-700 dark:text-neutral-300 whitespace-nowrap ml-2 mt-2"
            >
              <Vue3TreeView
                :items="files"
                :isCheckable="false"
                :hideGuideLines="true"
                @onSelect="handleSelectFile"
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
                <template v-slot:item-name="treeViewItem">
                  <ContextMenuRoot>
                    <ContextMenuTrigger>
                      {{ treeViewItem.name }}
                    </ContextMenuTrigger>
                    <ContextMenuPortal>
                      <ContextMenuContent
                        class="min-w-[150px] z-30 border border-neutral-600 bg-neutral-300 dark:text-neutral-300 dark:bg-neutral-800 outline-none rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                        :side-offset="5"
                      >
                        <ContextMenuItem
                          value="New File"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleNewFile(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.newFile") }}</div>
                        </ContextMenuItem>
                        <ContextMenuItem
                          value="New Folder"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleNewFolder(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.newFolder") }}</div>
                        </ContextMenuItem>
                        <ContextMenuSeparator
                          class="h-[1px] bg-neutral-600 dark:bg-neutral-600 m-[5px]"
                        />
                        <ContextMenuItem
                          value="Copy Path"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleCopyPath(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.copyPath") }}</div>
                        </ContextMenuItem>
                        <ContextMenuItem
                          value="Duplicate"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleDuplicate(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.duplicate") }}</div>
                        </ContextMenuItem>
                        <ContextMenuSeparator
                          class="h-[1px] bg-neutral-600 dark:bg-neutral-600 m-[5px]"
                        />
                        <ContextMenuItem
                          value="Rename"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleRename(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.rename") }}</div>
                        </ContextMenuItem>
                        <ContextMenuItem
                          value="Delete"
                          class="group text-[13px] leading-none text-grass11 rounded-[3px] flex items-center h-[25px] px-3 relative select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-green9 data-[highlighted]:text-gray-100"
                          @click="handleDelete(treeViewItem.meta.path)"
                        >
                          <div>{{ $t("fileTree.btn.delete") }}</div>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenuPortal>
                  </ContextMenuRoot>
                </template>
              </Vue3TreeView>
            </div>
          </div>
        </Pane>
        <Pane
          size="45"
          class="overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        >
          <ChatPane :project-id="projectId" />
        </Pane>
        <Pane class="overflow-hidden" size="50">
          <FilesContainer :project-id="projectId" />
        </Pane>
      </Splitpanes>
    </div>
  </template>
  <template v-else>
    <div class="w-full h-full flex items-center justify-center">
      <div class="text-neutral-700 dark:text-neutral-300 text-3xl">
        <LoaderAnimation />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "radix-vue";
import { Pane, Splitpanes } from "splitpanes";
import { getCurrentInstance, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import Vue3TreeView from "vue3-tree-vue";
import { backbone } from "../backbone/index.js";
import { ProjectApi } from "../client/index.js";
import ChatPane from "../components/ChatPane.vue";
import FilesContainer from "../components/FilesContainer.vue";
import LoaderAnimation from "../components/LoaderAnimation.vue";
import { errorToMessage } from "../helper/errorToMessage.js";
import { filenameToIcon } from "../helper/filenameToIcon.js";
import type { TreeViewItem } from "../types/file.js";

const props = defineProps<{
  projectId: string;
}>();

const { proxy } = getCurrentInstance()!;
const { t } = useI18n();
const router = useRouter();

const pageReady = ref(false);

const files = ref<TreeViewItem[]>([]);

const loadTree = async () => {
  try {
    files.value = await ProjectApi.getProjectFileTree(props.projectId);
  } catch (err) {
    const errorMessage = t(errorToMessage(err));
    const retry = await proxy?.$showPopover({
      title: t("dialog.error.loadProject.title"),
      message: t("dialog.error.loadProject.message", { errorMessage }),
      btnOneText: t("dialog.error.loadProject.btn.retry"),
      btnOneIcon: "refresh",
      btnOneValue: true,

      btnTwoText: t("dialog.error.loadProject.btn.back"),
      btnTwoIcon: "grid_view",
      btnTwoValue: false,
    });

    if (retry) {
      await loadTree();
    } else {
      router.push({ name: "ProjectOverview" });
    }
  }
};

onMounted(async () => {
  await loadTree();
  pageReady.value = true;

  backbone.on("file_upserted", () => loadTree());
  backbone.on("file_deleted", () => loadTree());
  backbone.on("file_deleted", () => loadTree());
});

onBeforeUnmount(async () => {
  backbone.off("file_upserted");
  backbone.off("file_deleted");
  backbone.off("file_deleted");
});

const handleSelectFile = async (item: TreeViewItem) => {
  if (item.meta.isDirectory) {
    item.expanded = !item.expanded;
    return;
  }
  window.backbone.emit("open_file", { path: item.meta.path });
};

const handleNewFolder = async (...args: unknown[]) => {
  console.log(args);
};

const handleNewFile = async (...args: unknown[]) => {
  console.log(args);
};

const handleCopyPath = async (...args: unknown[]) => {
  console.log(args);
};

const handleDuplicate = async (...args: unknown[]) => {
  console.log(args);
};

const handleRename = async (...args: unknown[]) => {
  console.log(args);
};

const handleMoveFile = async (oldPath: string, newPath: string) => {
  console.log(`Moving file from ${oldPath} to ${newPath}`);
};

const handleDelete = async (path: string) => {
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
