<template>
  <div class="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-800">
    <main class="flex-grow overflow-hidden">
      <div class="h-full">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
</script>

<style>
:root {
  --topbar-height: 64px; /* Adjust this value to match your Topbar height */
}

main {
  height: 100vh; 
  box-sizing: border-box;
}
</style>

