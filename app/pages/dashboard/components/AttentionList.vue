<script setup lang="ts">
import { computed } from "vue";
import DashboardCardShell from "./CardShell.vue";

type Level = "urgent" | "action" | "info";

interface AttentionItem {
  id: string | number;
  level: Level;
  title: string;
  detail: string;
}

const props = withDefaults(
  defineProps<{ data: AttentionItem[]; limit?: number; moreHref?: string }>(),
  {
    limit: 4,
    moreHref: "#",
  },
);

const dot: Record<Level, string> = {
  urgent: "bg-danger",
  action: "bg-warning",
  info: "bg-muted-foreground/40",
};

const all = computed(() => props.data);
const shown = computed(() => all.value.slice(0, props.limit));
const rest = computed(() => Math.max(0, all.value.length - props.limit));
</script>

<template>
  <DashboardCardShell
    title="Perlu perhatian"
    description="Urut dari yang paling mendesak"
  >
    <ul class="flex flex-col divide-y">
      <li v-if="all.length === 0" class="py-4 text-sm text-muted-foreground">
        Tidak ada hal yang perlu ditindaklanjuti untuk filter ini.
      </li>
      <li
        v-for="i in shown"
        :key="i.id"
        class="flex gap-3 py-3 first:pt-0 last:pb-0"
      >
        <span
          class="mt-1.5 size-2 shrink-0 rounded-full"
          :class="dot[i.level]"
        />
        <div class="min-w-0">
          <p class="text-sm font-medium leading-snug">{{ i.title }}</p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            {{ i.detail }}
          </p>
        </div>
      </li>
    </ul>
    <a
      v-if="rest"
      :href="moreHref"
      class="mt-auto pt-4 text-center text-xs font-semibold text-primary hover:underline"
    >
      Lihat semua ({{ all.length }})
    </a>
  </DashboardCardShell>
</template>
