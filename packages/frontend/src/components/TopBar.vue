<template>
  <nav class="bg-neutral-100 dark:bg-neutral-900">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-gray-800 dark:text-white">
              {{ title }}
            </h1>
          </div>
        </div>
        <div class="flex items-center">
          <button
            @click="toggleDarkmode"
            class="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none hover:ring-1 hover:ring-offset-1 hover:ring-indigo-500"
          >
            <span class="sr-only">Toggle dark mode</span>
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>
          <button
            @click="logout"
            class="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { AuthApi } from '../client/index.js'
import { useTheme } from '../store/index.js'

export default defineComponent({
  name: 'Topbar',
  props: {
    title: {
      type: String,
      default: 'BuildOwn.AI Pilot',
    },
  },
  setup() {
    const router = useRouter()

    const { toggleDarkmode } = useTheme()

    const logout = async () => {
      try {
        await AuthApi.logout()
        router.push('/')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    return {
      toggleDarkmode,
      logout,
    }
  },
})
</script>
