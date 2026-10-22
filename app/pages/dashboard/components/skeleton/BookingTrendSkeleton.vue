<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const tickTops = [4, 34.7, 65.3, 96];
const gridY = [8, 69.3, 130.7, 192];
const stats = [
  "Booking akhir pekan",
  "Booking hari kerja",
  "Rata-rata lead time",
];
</script>

<template>
  <DashboardCardShell title="Tren booking" aria-hidden="true">
    <template #description>
      <SkLine size="xs" class="w-56 max-w-full" />
    </template>
    <template #action><Skeleton class="h-5 w-36 rounded-full" /></template>

    <div class="flex flex-col gap-2">
      <div class="flex h-[280px] gap-2 pt-10">
        <div class="relative w-7 shrink-0">
          <Skeleton
            v-for="top in tickTops"
            :key="top"
            class="absolute right-0 h-2.5 w-4 -translate-y-1/2"
            :style="{ top: `${top}%` }"
          />
        </div>
        <div class="relative min-w-0 flex-1">
          <svg
            class="absolute inset-0 size-full"
            viewBox="0 0 560 200"
            preserveAspectRatio="none"
          >
            <line
              v-for="y in gridY"
              :key="y"
              x1="0"
              x2="560"
              :y1="y"
              :y2="y"
              class="stroke-border"
              stroke-dasharray="3 4"
              vector-effect="non-scaling-stroke"
            />
            <path
              class="animate-pulse fill-primary/10"
              d="M0 150 C60 120 90 60 140 80 S220 150 280 120 S360 40 420 70 S500 130 560 100 L560 192 L0 192 Z"
            />
          </svg>
        </div>
      </div>
      <div class="ml-9 grid grid-cols-5">
        <div v-for="n in 5" :key="n" class="pl-1">
          <SkLine size="xs" class="w-8" />
        </div>
      </div>
    </div>

    <dl class="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-3">
      <div v-for="label in stats" :key="label" class="flex flex-col gap-0.5">
        <dt class="text-xs text-muted-foreground">{{ label }}</dt>
        <dd class="h-5">
          <Skeleton class="h-3 w-20" />
        </dd>
      </div>
    </dl>
    <div class="mt-5 flex flex-col rounded-xl bg-primary/5 px-4 py-3">
      <SkLine class="h-[22.75px] w-full" />
      <SkLine class="h-[22.75px] w-2/3" />
    </div>
  </DashboardCardShell>
</template>
