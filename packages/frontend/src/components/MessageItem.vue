<template>
  <div class="flex flex-row sm:px-4">
    <div class="flex-shrink-0 mr-3">
      <div class="text-xl pt-5">
        {{ isUser ? "🤵" : "🤖" }}
      </div>
    </div>
    <div class="flex-grow overflow-x-hidden">
      <transition-group name="shine" tag="div">
        <div
          v-for="(tool, index) in tools"
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
      </transition-group>
      <VueMarkdown
        :source="message.content"
        :class="isUser ? 'dark:text-gray-400 text-gray-500' : ''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import VueMarkdown from "./VueMarkdown.vue";

import { computed } from "vue";
import type { ChatMessage, ChatMessageToolUsage } from "../types/chat.js";

const props = defineProps<{
  message: ChatMessage;
}>();

const { t } = useI18n();

const isUser = computed(() => props.message.role === "user");
const tools = computed(() => props.message.tools ?? []);

const toolToText = (tool: ChatMessageToolUsage) => {
  switch (tool.name) {
    case "read_file":
      return t("toolcall.readFile");
    case "check_if_file_exist":
      return t("toolcall.checkIfFileExists");
    case "create_directory":
      return t("toolcall.createDirectory");
    case "fetch_webpage":
      return t("toolcall.fetchWebpage");
    case "get_folder_structure":
      return t("toolcall.getFolderStructure");
    case "get_npm_package_info":
      return t("toolcall.npmPackageInfo", {
        name: tool.arguments.name,
        version: tool.arguments.version ?? "latest",
      });
    case "get_context":
      return t("toolcall.getContext");
    case "write_file":
      return t("toolcall.writeFile");
    default:
      return t("toolcall.unknownTool");
  }
};
</script>

<style scoped lang="css">
/* Transition classes */
:deep(.shine-enter-active) {
  position: relative;
  transition: all 0.5s ease;
}

:deep(.shine-enter-from),
:deep(.shine-leave-to) {
  opacity: 0;
  transform: translateY(20px);
}

:deep(.shine-enter-to),
:deep(.shine-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

/* Shine effect */
:deep(.shine-enter-active) .text-sm {
  position: relative;
  overflow: hidden;
}

:deep(.shine-enter-active) .text-sm::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: shine 1s forwards;
}

@keyframes shine {
  from {
    left: -100%;
  }
  to {
    left: 100%;
  }
}
</style>
