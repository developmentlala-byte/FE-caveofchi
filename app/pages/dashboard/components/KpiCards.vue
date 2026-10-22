<script setup lang="ts">
import { computed } from "vue";
import { Card } from "@/components/ui/card";
import { formatMoney } from "~/utils/money";
import { formatNumber, formatPercent } from "../utils/format";
import DashboardToneBadge from "./ToneBadge.vue";

type KpiFormat = "number" | "percent" | "rupiah";
type Tone = "good" | "bad" | "neutral";

interface Kpi {
  key: string;
  label: string;
  value: number | null;
  format: KpiFormat;
  change?: number;
  changeUnit?: "%" | "poin";
  higherIsBetter?: boolean;
  note: string;
  badge?: string;
}

const props = withDefaults(defineProps<{ data: Kpi[]; shown?: string[] }>(), {
  shown: () => ["bookings", "fillRate", "upcoming", "cancelRate", "revenue"],
});

const formatValue = (k: Kpi) => {
  const v =
    typeof k.value === "number" && Number.isFinite(k.value) ? k.value : 0;
  if (k.format === "rupiah") return formatMoney(v);
  if (k.format === "percent") return formatPercent(v);
  return formatNumber(v);
};

const items = computed(() =>
  props.data
    .filter((k) => props.shown.includes(k.key))
    .map((k) => {
      let badge = k.badge ?? "";
      let tone: Tone = "neutral";
      if (k.change !== undefined) {
        const up = k.change > 0;
        tone =
          k.change === 0
            ? "neutral"
            : up === (k.higherIsBetter ?? true)
              ? "good"
              : "bad";
        badge = `${up ? "↑" : "↓"} ${formatNumber(Math.abs(k.change))}${k.changeUnit === "poin" ? " poin" : "%"}`;
      }
      return {
        key: k.key,
        label: k.label,
        value: formatValue(k),
        note: k.note,
        badge,
        tone,
      };
    }),
);
</script>

<template>
  <section
    aria-label="Ringkasan utama"
    class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1"
  >
    <Card
      v-for="item in items"
      :key="item.key"
      class="min-w-0 gap-3 p-4 sm:p-5"
    >
      <p
        class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {{ item.label }}
      </p>

      <!-- Wadah ukur: ukuran huruf mengikuti lebar kartu (11cqw), dibatasi 18px–30px -->
      <div class="min-w-0" style="container-type: inline-size">
        <p
          class="whitespace-nowrap font-semibold leading-tight tracking-tight tabular-nums"
          style="font-size: clamp(1.125rem, 11cqw, 1.875rem)"
        >
          {{ item.value }}
        </p>
      </div>

      <div class="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        <DashboardToneBadge v-if="item.badge" :tone="item.tone">{{
          item.badge
        }}</DashboardToneBadge>
        <span class="text-xs text-muted-foreground">{{ item.note }}</span>
      </div>
    </Card>
  </section>
</template>
