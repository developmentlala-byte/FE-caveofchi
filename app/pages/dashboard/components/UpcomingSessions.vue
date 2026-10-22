<script setup lang="ts">
import { computed } from "vue";
import DashboardCardShell from "./CardShell.vue";
import DashboardToneBadge from "./ToneBadge.vue";

interface SessionRow {
  id: string | number;
  when: string;
  event: string;
  studio: string;
  filled: number;
  quota: number;
}

interface UpcomingSessions {
  sessions: SessionRow[];
  moreCount: number;
  moreHref: string;
}

const props = defineProps<{ data: UpcomingSessions }>();

const view = computed(() => props.data);

const rows = computed(() =>
  view.value.sessions.map((s) => {
    const pct = s.quota > 0 ? (s.filled / s.quota) * 100 : 0;
    return {
      ...s,
      tag:
        pct >= 100
          ? { text: "Penuh", tone: "good" as const }
          : pct < 40
            ? { text: "Sepi", tone: "warn" as const }
            : null,
    };
  }),
);
</script>

<template>
  <DashboardCardShell title="Sesi mendatang" description="7 hari ke depan">
    <template #action>
      <a
        v-if="view.moreCount > 0"
        :href="view.moreHref"
        class="text-xs font-semibold text-primary hover:underline"
        >Lihat {{ view.moreCount }} lainnya</a
      >
    </template>

    <ul class="flex flex-col divide-y">
      <li
        v-if="rows.length === 0"
        class="py-4 text-sm text-muted-foreground"
      >
        Tidak ada sesi dalam 7 hari ke depan untuk filter ini.
      </li>
      <li
        v-for="s in rows"
        :key="s.id"
        class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ s.event }}</p>
          <p class="text-xs text-muted-foreground">
            {{ s.when }} · {{ s.studio }}
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end gap-1">
          <span class="text-sm font-medium tabular-nums"
            >{{ s.filled }}/{{ s.quota }}</span
          >
          <DashboardToneBadge v-if="s.tag" :tone="s.tag.tone">{{
            s.tag.text
          }}</DashboardToneBadge>
        </div>
      </li>
    </ul>
  </DashboardCardShell>
</template>
