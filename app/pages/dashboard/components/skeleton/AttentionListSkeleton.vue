<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const titleWidths = ["w-4/5", "w-3/5", "w-11/12", "w-2/3"];
</script>

<template>
  <DashboardCardShell
    title="Perlu perhatian"
    description="Urut dari yang paling mendesak"
    aria-hidden="true"
  >
    <ul class="flex flex-col divide-y">
      <li
        v-for="(width, index) in titleWidths"
        :key="index"
        class="flex gap-3 py-3 first:pt-0 last:pb-0"
      >
        <Skeleton class="mt-1.5 size-2 shrink-0 rounded-full" />
        <div class="flex min-w-0 flex-1 flex-col">
          <SkLine size="sm" :class="width" />
          <SkLine size="xs" class="h-[19.5px] w-full" />
        </div>
      </li>
    </ul>
  </DashboardCardShell>
</template>
