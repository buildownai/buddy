<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative"
  >
    <button
      @click="toggleDarkmode"
      class="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
    >
      <svg
        v-if="isDarkmode()"
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
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

    <div class="max-w-md w-full">
      <div
        class="text-8xl text-center text-gray-900 dark:text-white flex justify-center"
      >
        <div class="font-light text-gray-300 dark:text-gray-700 text-5xl pt-6">
          &lt;{
        </div>
        <div class="font-semibold">PILOT</div>
        <div class="font-light text-gray-300 dark:text-gray-700 text-5xl pt-6">
          }&gt;
        </div>
      </div>
      <div class="text-xl text-center text-gray-500 dark:text-gray-400">
        <span class="font-light text-xs">POWERED BY<br /></span
        ><a href="https://buildown.ai" target="_blank" title="Build Own AI"
          ><span class="font-semibold text-blue-800">Build</span
          ><span class="font-light">Own</span
          ><span class="font-semibold text-blue-800">.AI</span></a
        >
      </div>
      <div>
        <h2
          class="mt-10 text-center text-xl font-extrabold text-gray-900 dark:text-white"
        >
          {{ $t("login.title") }}
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              v-model="email"
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-lg bg-white dark:bg-gray-800"
              placeholder="user@example.com"
              @keyup.enter="handleSubmit"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              v-model="password"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-lg bg-white dark:bg-gray-800"
              placeholder="password"
              @keyup.enter="handleSubmit"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isLoading || !isFormValid"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg
                class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            {{ isLoading ? $t("login.btn.signingIn") : $t("login.btn.login") }}
          </button>
        </div>
      </form>
      <div
        v-if="error"
        class="mt-4 text-center text-sm text-red-600 dark:text-red-400"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthApi } from '../client/index.js'
import { useTheme } from '../store/index.js'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const isFormValid = ref(false)

const { toggleDarkmode, isDarkmode } = useTheme()

watch([email, password], ([newEmail, newPassword]) => {
  isFormValid.value = newEmail.trim() !== '' && newPassword.trim() !== ''
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  error.value = ''

  try {
    const response = await AuthApi.login(email.value, password.value)

    // Redirect to the originally requested page or default to ProjectOverview
    const redirectPath = (route.query.redirect as string) || {
      name: 'ProjectOverview',
    }
    router.push(redirectPath)
  } catch (err) {
    error.value = 'Invalid email or password'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>
