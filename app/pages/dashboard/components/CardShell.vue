<script setup lang="ts">
import { Card } from "@/components/ui/card";

defineProps<{ title: string; description?: string }>();
</script>

<template>
  <Card class="h-full gap-0 p-0">
    <header class="flex items-start justify-between gap-3 border-b px-5 py-4">
      <div class="min-w-0">
        <h2 class="text-sm font-semibold">{{ title }}</h2>
        <div
          v-if="description || $slots.description"
          class="mt-0.5 text-xs text-muted-foreground"
        >
          <slot name="description">{{ description }}</slot>
        </div>
      </div>
      <slot name="action" />
    </header>
    <div class="flex flex-1 flex-col p-5">
      <slot />
    </div>
  </Card>
</template>
