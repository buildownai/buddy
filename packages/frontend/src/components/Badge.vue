<template>
  <div>
  <span
    class="inline-flex items-center gap-x-2 rounded-full px-2.5 py-1 text-sm font-semibold leading-5" :class="colors.bg"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full" :class="colors.color"></span>
    <slot></slot>
  </span>
</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'normal' | 'success' | 'error' | 'warning'
  count?: string | number
}>()

const colors = computed(() => {
  switch (props.type) {
    case 'success':
      return { bg: 'bg-green-600/20 text-green-600', color: 'bg-green-600' }
    case 'warning':
      return { bg: 'bg-amber-600/20 text-amber-600', color: 'bg-amber-600' }
    case 'error':
      return { bg: 'bg-red-600/20 text-red-600', color: 'bg-red-600' }
    default:
      return { bg: 'bg-blue-600/20 text-blue-600', color: 'bg-blue-600' }
  }
})
</script>