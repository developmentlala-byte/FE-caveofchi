<script setup lang="ts">
import { Toaster } from "~/components/ui/sonner";

useHead({
  title: "Cave Of Chi",
  titleTemplate: "%s | Cave Of Chi",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster position="top-right" :offset="20" :duration="4000" />
</template>
