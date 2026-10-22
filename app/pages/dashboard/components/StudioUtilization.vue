<script setup lang="ts">
import { computed } from "vue";
import { formatMoney } from "~/utils/money";
import DashboardCardShell from "./CardShell.vue";
import DashboardMeterBar from "./MeterBar.vue";

interface StudioRow {
  id: string | number;
  name: string;
  capacity: number;
  active: boolean;
  scheduledSessions: number;
  revenue: number;
}

interface StudioUtilization {
  studios: StudioRow[];
}

const props = defineProps<{ data: StudioUtilization }>();

const view = computed(() => props.data);
const maxSessions = computed(() =>
  Math.max(1, ...view.value.studios.map((studio) => studio.scheduledSessions)),
);
const rows = computed(() =>
  view.value.studios.map((s) => {
    const relativeSessions = Math.round(
      (s.scheduledSessions / maxSessions.value) * 100,
    );
    return {
      ...s,
      relativeSessions,
      revenueLabel: formatMoney(s.revenue),
    };
  }),
);
</script>

<template>
  <DashboardCardShell
    title="Aktivitas studio"
    description="Jumlah sesi terjadwal pada periode yang dipilih"
  >
    <ul class="flex flex-col gap-5">
      <li v-for="s in rows" :key="s.id" class="flex flex-col gap-2">
        <div class="flex items-baseline justify-between gap-2 text-sm">
          <span class="min-w-0 truncate font-medium">
            {{ s.name }}
            <span class="font-normal text-muted-foreground"
              >· {{ s.capacity }} orang</span
            >
          </span>
          <span class="shrink-0 font-semibold tabular-nums">
            {{ s.scheduledSessions }} sesi
          </span>
        </div>
        <DashboardMeterBar
          :value="s.relativeSessions"
          :tone="s.active ? 'brand' : 'warn'"
          :label="`Aktivitas ${s.name}`"
        />
        <p class="text-xs text-muted-foreground">
          {{ s.active ? "Aktif" : "Nonaktif" }} · pendapatan lunas
          {{ s.revenueLabel }}
        </p>
      </li>
      <li
        v-if="rows.length === 0"
        class="text-sm text-muted-foreground"
      >
        Tidak ada studio untuk filter ini.
      </li>
    </ul>
  </DashboardCardShell>
</template>
