<template>
  <router-view></router-view>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import { backbone } from './backbone/index.js'
import { useTheme } from './store/index.js'

export default defineComponent({
  name: 'App',
  setup() {
    const { enableDarkmode, disableDarkmode } = useTheme()
    onMounted(() => {
      window.backbone = backbone
      // Check for dark mode preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        enableDarkmode()
      } else {
        disableDarkmode()
      }
    })
  },
})
</script>
