<template>
  <div class="space-y-6 m-8">
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Projects Overview</h1>
    <ProjectGrid />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ProjectGrid from '../components/ProjectGrid.vue'

export default defineComponent({
  name: 'OverviewPage',
  components: {
    ProjectGrid,
  },
})
</script>
