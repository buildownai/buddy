<template>
  <div class="flex h-full">
    <div
      class="h-full bg-neutral-300 dark:bg-neutral-950 w-12 min-w-12 relative text-neutral-600 dark:text-neutral-200 small-file-nav overflow-hidden"
    >
      <div class="text-center top-5 flex-row absolute">
        <div class="grow-0">
          <div
            class="material-icons-outlined w-12 h12 cursor-pointer"
            :title="$t('sidenav.title.files')"
          >
            code
          </div>
        </div>
      </div>
      <div class="text-center bottom-5 flex-row absolute">
        <div class="grow-0 mb-10">
          <RouterLink
            class="material-icons-outlined w-12 h12 cursor-pointer"
            :title="$t('sidenav.title.projectsOverview')"
            :to="{ name: 'ProjectOverview' }"
          >
            grid_view
          </RouterLink>
        </div>
        <div class="grow-0 mb-3">
          <div
            class="material-icons-outlined w-12 h12 cursor-pointer"
            :title="$t('sidenav.title.toggleDarkmode')"
            @click="toggleDarkmode"
          >
            {{ isDarkmode() ? "light_mode" : "dark_mode" }}
          </div>
        </div>
        <div class="grow-0">
          <div
            class="material-icons-outlined w-12 h12 cursor-pointer"
            :title="$t('sidenav.title.logout')"
            @click="logout"
          >
            logout
          </div>
        </div>
      </div>
    </div>
    <div class="w-full">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { AuthApi } from "../client/index.js";

import { useTheme } from "../store/index.js";

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const { toggleDarkmode, isDarkmode } = useTheme();

const logout = async () => {
  try {
    await AuthApi.logout();
    router.push("/");
  } catch (error) {
    console.error("Logout failed:", error);
  }
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
