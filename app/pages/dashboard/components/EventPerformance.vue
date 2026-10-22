<script setup lang="ts">
import { computed } from "vue";
import { formatMoney } from "~/utils/money";
import DashboardCardShell from "./CardShell.vue";
import DashboardMeterBar from "./MeterBar.vue";
import DashboardToneBadge from "./ToneBadge.vue";

interface EventRow {
  id: string | number;
  name: string;
  sessions: number;
  bookings: number;
  capacity: number;
  revenue: number;
}

const props = defineProps<{ data: EventRow[] }>();

const fillOf = (b: number, c: number) =>
  c > 0 ? Math.round((b / c) * 100) : 0;

const rows = computed(() =>
  [...props.data]
    .sort((a, b) => b.revenue - a.revenue)
    .map((e) => {
      const fill = fillOf(e.bookings, e.capacity);
      return {
        ...e,
        fill,
        revenueText: formatMoney(e.revenue),
        barTone: fill >= 55 ? ("brand" as const) : ("warn" as const),
        tag:
          fill >= 85
            ? { text: "Cepat penuh", tone: "good" as const }
            : fill < 55
              ? { text: "Sepi", tone: "warn" as const }
              : null,
      };
    }),
);

const total = computed(() => {
  const l = props.data;
  const sum = (f: (e: EventRow) => number) => l.reduce((a, e) => a + f(e), 0);
  return {
    sessions: sum((e) => e.sessions),
    bookings: sum((e) => e.bookings),
    fill: fillOf(
      sum((e) => e.bookings),
      sum((e) => e.capacity),
    ),
    revenue: formatMoney(sum((e) => e.revenue)),
  };
});

const th =
  "px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
</script>

<template>
  <DashboardCardShell
    title="Performa event"
    description="Urut dari pendapatan tertinggi"
  >
    <div class="-mx-5 -my-5 flex-1 overflow-x-auto">
      <table class="w-full min-w-[560px] text-sm">
        <thead class="bg-muted/60">
          <tr>
            <th :class="th">Event</th>
            <th :class="[th, 'text-right']">Sesi</th>
            <th :class="[th, 'text-right']">Booking</th>
            <th :class="[th, 'w-40']">Fill rate</th>
            <th :class="[th, 'text-right']">Pendapatan</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-if="rows.length === 0">
            <td
              colspan="5"
              class="px-5 py-8 text-center text-sm text-muted-foreground"
            >
              Tidak ada performa event untuk filter ini.
            </td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td class="px-5 py-3.5">
              <p class="font-medium">{{ r.name }}</p>
              <DashboardToneBadge
                v-if="r.tag"
                class="mt-1"
                :tone="r.tag.tone"
                >{{ r.tag.text }}</DashboardToneBadge
              >
            </td>
            <td class="px-5 py-3.5 text-right tabular-nums">
              {{ r.sessions }}
            </td>
            <td class="px-5 py-3.5 text-right tabular-nums">
              {{ r.bookings }}
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <DashboardMeterBar
                  class="flex-1"
                  :value="r.fill"
                  :tone="r.barTone"
                  :label="`Fill rate ${r.name}`"
                />
                <span class="w-9 text-right text-xs tabular-nums"
                  >{{ r.fill }}%</span
                >
              </div>
            </td>
            <td class="px-5 py-3.5 text-right font-medium tabular-nums">
              {{ r.revenueText }}
            </td>
          </tr>
        </tbody>
        <tfoot class="border-t bg-muted/60 text-sm font-semibold">
          <tr>
            <td class="px-5 py-3">Total</td>
            <td class="px-5 py-3 text-right tabular-nums">
              {{ total.sessions }}
            </td>
            <td class="px-5 py-3 text-right tabular-nums">
              {{ total.bookings }}
            </td>
            <td class="px-5 py-3 tabular-nums">{{ total.fill }}%</td>
            <td class="px-5 py-3 text-right tabular-nums">
              {{ total.revenue }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </DashboardCardShell>
</template>
