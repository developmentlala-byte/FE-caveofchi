<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import AuthVerificationNotice from '@/components/AuthVerificationNotice.vue'
import { useSidebarStore } from '~/stores/sidebar'

const mobileOpen = ref(false)
const sidebarStore = useSidebarStore()

onMounted(() => sidebarStore.restorePinnedState())

function toggleSidebar() {
  if (window.matchMedia('(min-width: 768px)').matches) {
    sidebarStore.togglePinned()
    return
  }

  mobileOpen.value = !mobileOpen.value
}
</script>

<template>
  <div class="flex min-h-svh w-full bg-background">
    <AppSidebar v-model:mobile-open="mobileOpen" />

    <div class="flex min-h-svh min-w-0 flex-1 flex-col">
      <SiteHeader
        :mobile-open="mobileOpen"
        @toggle-sidebar="toggleSidebar"
      />
      <AuthVerificationNotice />
      <main class="flex flex-1 flex-col">
        <slot />
      </main>
    </div>
  </div>
</template>
