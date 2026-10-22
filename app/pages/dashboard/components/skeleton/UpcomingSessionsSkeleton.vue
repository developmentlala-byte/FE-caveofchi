<script setup lang="ts">
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const widths = ["w-40", "w-32", "w-44", "w-36"];
</script>

<template>
  <DashboardCardShell
    title="Sesi mendatang"
    description="7 hari ke depan"
    aria-hidden="true"
  >
    <template #action><SkLine size="xs" class="w-20" /></template>
    <ul class="flex flex-col divide-y">
      <li
        v-for="(width, index) in widths"
        :key="index"
        class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <SkLine size="sm" :class="width" />
          <SkLine size="xs" class="w-48 max-w-full" />
        </div>
        <SkLine size="sm" class="w-9 shrink-0" />
      </li>
    </ul>
  </DashboardCardShell>
</template>
