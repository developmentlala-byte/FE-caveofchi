<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const heights = [44, 58, 72, 40, 54, 104, 86];
</script>

<template>
  <DashboardCardShell
    title="Hari tersibuk"
    description="Jumlah sesi per hari relatif terhadap hari tersibuk"
    aria-hidden="true"
  >
    <div class="flex h-[168px] items-end gap-2">
      <div
        v-for="(height, index) in heights"
        :key="index"
        class="flex flex-1 flex-col items-center justify-end gap-1.5"
      >
        <div class="flex h-4 items-center gap-1">
          <Skeleton class="h-2.5 w-6" />
          <span class="text-[11px]">sesi</span>
        </div>
        <Skeleton
          class="w-full rounded-md"
          :style="{ height: `${height}px` }"
        />
      </div>
    </div>
    <div class="mt-2 flex gap-2">
      <div v-for="day in 7" :key="day" class="flex flex-1 justify-center">
        <SkLine size="xs" class="w-6" />
      </div>
    </div>
    <div class="mt-4 flex flex-col">
      <SkLine size="sm" class="w-full" />
      <SkLine size="sm" class="w-3/4" />
    </div>
  </DashboardCardShell>
</template>
