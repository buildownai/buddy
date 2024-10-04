<template>
  <div
    class="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ $t("addRepo.title") }}
        </h1>
        <button
          @click="goBack"
          class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      </div>
      <form
        v-if="!isAnalyzing && !isComplete"
        @submit.prevent="handleSubmit"
        class="space-y-6"
      >
        <div>
          <label
            for="name"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >{{ $t("addRepo.label.projectName") }}</label
          >
          <input
            id="name"
            v-model="name"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg py-3 px-4"
            placeholder="My Project"
          />
        </div>
        <div>
          <label
            for="repositoryUrl"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >{{ $t("addRepo.label.repositoryUrl") }}</label
          >
          <input
            id="repositoryUrl"
            v-model="repositoryUrl"
            type="text"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg py-3 px-4"
            placeholder="https://github.com/username/repo"
          />
        </div>
        <div>
          <button
            :title="$t('addRepo.btn.addRepository')"
            type="submit"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {{ $t("addRepo.btn.addRepository") }}
          </button>
        </div>
      </form>
    </div>
    <div v-if="isAnalyzing" class="p-6 bg-gray-50 dark:bg-gray-900">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {{ $t("addRepo.progress.title") }}
      </h2>
      <div v-for="(step, index) in steps" :key="index" class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <span
            class="text-base font-medium text-gray-700 dark:text-gray-300"
            >{{ step }}</span
          >
          <span
            class="text-base font-medium text-gray-700 dark:text-gray-300"
            v-if="currentStep === step"
            >{{ stepProgress }}%</span
          >
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
          <div
            class="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
            :style="{
              width: `${
                currentStep === step
                  ? stepProgress
                  : index < steps.indexOf(currentStep)
                  ? 100
                  : 0
              }%`,
            }"
          ></div>
        </div>
      </div>
      <p class="text-base text-gray-600 dark:text-gray-400 mt-2">
        {{ progressMessage }}
      </p>
    </div>
    <div v-if="isComplete" class="p-6 text-center bg-gray-50 dark:bg-gray-900">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        {{ $t("addRepo.progress.success.title") }}
      </h2>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-6">
        {{ $t("addRepo.progress.success.message") }}
      </p>
      <button
        @click="goToChat"
        class="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-xl font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
      >
        {{ $t("addRepo.progress.btn") }}
      </button>
    </div>
    <div
      v-if="error"
      class="p-4 bg-red-100 dark:bg-red-900 border-t border-red-200 dark:border-red-800"
    >
      <p class="text-lg text-red-700 dark:text-red-300">{{ error }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RepoApi } from '../client/index.js'
import type { SSEMessage } from '../types/sse.js'

const router = useRouter()
const repositoryUrl = ref('')
const name = ref('')
const isAnalyzing = ref(false)
const isComplete = ref(false)
const stepProgress = ref(0)
const progressMessage = ref('')
const currentStep = ref('')
const steps = ref<string[]>([])
const error = ref('')
const projectId = ref('')

const handleSubmit = async () => {
  if (!repositoryUrl.value) return

  isAnalyzing.value = true
  stepProgress.value = 0
  progressMessage.value = ''
  currentStep.value = ''
  steps.value = []
  error.value = ''

  try {
    const eventStream = RepoApi.analyzeRepo(repositoryUrl.value, name.value)

    for await (const event of eventStream) {
      const data = event as SSEMessage

      console.log(data)

      switch (data.event) {
        case 'info':
          steps.value = data.steps
          break
        case 'progress':
          stepProgress.value = data.progress
          progressMessage.value = data.message
          currentStep.value = data.step
          break
        case 'complete':
          progressMessage.value = data.message
          isAnalyzing.value = false
          isComplete.value = true
          projectId.value = data.projectId
          break
        case 'error':
          throw new Error(data.message)
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
    isAnalyzing.value = false
  }
}

const goBack = () => {
  router.push({ name: 'ProjectOverview' })
}

const goToChat = () => {
  router.push({
    name: 'ProjectChat',
    params: { projectId: projectId.value },
  })
}
</script>
