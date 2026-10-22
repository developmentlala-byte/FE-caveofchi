<script setup lang="ts">
import { computed } from "vue";
import DashboardCardShell from "./CardShell.vue";

interface Heatmap {
  periods: { label: string; hours: string }[];
  days: { day: string; sessions: number[] }[];
  insight: string;
}

const props = defineProps<{ data: Heatmap }>();

const BAR_MAX = 120; // tinggi batang tertinggi (px)

const bars = computed(() => {
  const v = props.data;
  const list = v.days.map((d) => ({
    day: d.day,
    short: d.day.slice(0, 3),
    sessions: d.sessions.reduce((a, n) => a + n, 0),
  }));
  const max = Math.max(1, ...list.map((b) => b.sessions));
  return list.map((b) => ({
    ...b,
    pct: Math.round((b.sessions / max) * 100),
    height: Math.max(4, (b.sessions / max) * BAR_MAX),
    top: b.sessions === max,
  }));
});

const summary = computed(() => {
  const sorted = [...bars.value].sort((a, b) => b.pct - a.pct);
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  if (!hi || !lo) return "";
  return `Aktivitas tertinggi ${hi.day} (${hi.sessions} sesi), terendah ${lo.day} (${lo.sessions} sesi).`;
});
</script>

<template>
  <DashboardCardShell
    title="Hari tersibuk"
    description="Jumlah sesi per hari relatif terhadap hari tersibuk"
  >
    <div
      class="flex h-[168px] items-end gap-2"
      role="img"
      aria-label="Grafik batang jumlah sesi per hari"
    >
      <div
        v-for="b in bars"
        :key="b.day"
        class="flex flex-1 flex-col items-center justify-end gap-1.5"
      >
        <span
          class="text-[11px] tabular-nums"
          :class="b.top ? 'font-semibold' : 'text-muted-foreground'"
          >{{ b.sessions }} sesi</span
        >
        <div
          class="w-full rounded-md"
          :class="b.top ? 'bg-primary' : 'bg-primary/20'"
          :style="{ height: `${b.height}px` }"
        />
      </div>
    </div>
    <div class="mt-2 flex gap-2 text-[11px] text-muted-foreground">
      <span v-for="b in bars" :key="b.day" class="flex-1 text-center">{{
        b.short
      }}</span>
    </div>
    <p class="mt-4 text-sm text-muted-foreground">
      {{ props.data.insight || summary }}
    </p>
  </DashboardCardShell>
</template>
