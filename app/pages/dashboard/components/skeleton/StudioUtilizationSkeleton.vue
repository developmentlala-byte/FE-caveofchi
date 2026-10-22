<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

withDefaults(defineProps<{ count?: number }>(), { count: 3 });
const names = ["w-32", "w-28", "w-36", "w-24"];
</script>

<template>
  <DashboardCardShell
    title="Aktivitas studio"
    description="Jumlah sesi terjadwal pada periode yang dipilih"
    aria-hidden="true"
  >
    <ul class="flex flex-col gap-5">
      <li v-for="n in count" :key="n" class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between gap-2">
          <SkLine size="sm" :class="names[(n - 1) % names.length]" />
          <span class="flex items-center gap-1 text-sm font-semibold">
            <Skeleton class="h-3 w-7" />
            sesi
          </span>
        </div>
        <Skeleton class="h-1.5 w-full rounded-full" />
        <SkLine size="xs" class="w-3/4" />
      </li>
    </ul>
  </DashboardCardShell>
</template>
