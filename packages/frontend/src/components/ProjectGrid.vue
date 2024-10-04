<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
  >
    <!-- Add New Project Card -->
    <router-link
      :to="{ name: 'ProjectAdd' }"
      class="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
    >
      <div class="text-4xl text-gray-400 dark:text-gray-500 mb-2">+</div>
      <div class="text-gray-600 dark:text-gray-400 font-medium">
        Add New Project
      </div>
    </router-link>

    <!-- Project Cards -->
    <router-link
      v-for="project in projects"
      :key="project.id"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-150 cursor-pointer overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-700"
      :to="{ name: 'ProjectChat', params: { projectId: project.id } }"
    >
      <div class="text-3xl mb-2">{{ project.icon }}</div>
      <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {{ project.name }}
      </h3>
      <p class="text-gray-600 dark:text-gray-400">{{ project.name }}</p>
      <p class="text-gray-600 dark:text-gray-400 font-light text-sm">
        {{ project.repositoryUrl }}
      </p>
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { type Project, ProjectApi } from '../client/index.js'
const projects = ref<Project[]>([])

onMounted(async () => {
  try {
    projects.value = await ProjectApi.getProjects()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  }
})
</script>
