<template>huhu</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

onMounted(async () => {
  const root = await navigator.storage.getDirectory()
  await navigator.storage.persist()
  //const draftHandle = await root.getFileHandle("draft.txt", { create: true });
  //const accessHandle = await draftHandle.createSyncAccessHandle();
  //const f =  await draftHandle.getFile()
  //f;
  // Persist changes to disk.
  //
  // accessHandle.write("huhuh");
  //accessHandle.close();
  //persist()
})
</script>
