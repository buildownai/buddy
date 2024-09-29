<template>
  <form class="mt-2" @submit.prevent="sendMessage">
    <label for="chat-input" class="sr-only">Enter your prompt</label>
    <div class="relative">
      <button
        type="button"
        class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-500"
      >
        <svg
          aria-hidden="true"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path
            d="M9 2m0 3a3 3 0 0 1 3 -3h0a3 3 0 0 1 3 3v5a3 3 0 0 1 -3 3h0a3 3 0 0 1 -3 -3z"
          ></path>
          <path d="M5 10a7 7 0 0 0 14 0"></path>
          <path d="M8 21l8 0"></path>
          <path d="M12 17l0 4"></path>
        </svg>
        <span class="sr-only">Use voice input</span>
      </button>
      <textarea
        id="chat-input"
        ref="inputElement"
        v-model="inputMessage"
        @keydown.enter.exact.prevent="sendMessage"
        class="block w-full resize-none rounded-xl border-none bg-slate-200 p-4 pl-10 pr-20 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400 dark:focus:ring-blue-500 sm:text-base"
        placeholder="Enter your prompt"
        :rows="rows"
        required
        :disabled="isLoading"
      ></textarea>
      <button
        type="submit"
        v-if="!isLoading"
        :disabled="!inputMessage.trim()"
        class="absolute h-10 bottom-2 right-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="material-icons-outlined">send</div>
        <span class="sr-only">Send message</span>
      </button>
      <button
        @click="abort"
        type="button"
        v-else
        class="absolute h-10 bottom-2 right-2.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="material-icons-outlined">stop_circle</div>
        <span class="sr-only">Send message</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "send-message", message: string): void;
  (e: "update:isLoading", value: boolean): void;
  (e: "abort", value: boolean): void;
}>();

const inputMessage = ref("");
const inputElement = ref<HTMLTextAreaElement | null>(null);

const context = ref<string[]>([]);

const rows = computed(() => {
  const l = inputMessage.value.split("\n").length;
  return l > 5 ? 5 : l;
});

const sendMessage = () => {
  if (inputMessage.value.trim() && !props.isLoading) {
    emit("update:isLoading", true);
    emit("send-message", inputMessage.value.trim());
    inputMessage.value = "";
  }
};

const abort = () => {
  emit("abort", true);
};

const focus = () => {
  inputElement.value?.focus();
};

defineExpose({ focus });
</script>
