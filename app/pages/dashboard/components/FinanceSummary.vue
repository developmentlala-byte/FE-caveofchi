<script setup lang="ts">
import { computed } from "vue";
import { formatMoney } from "~/utils/money";
import { formatNumber } from "../utils/format";
import DashboardCardShell from "./CardShell.vue";

type StatusKey = "paid" | "pending" | "cancelled" | "expired" | "review";

interface FinanceData {
  realized: { amount: number; bookings: number };
  pending: { amount: number; bookings: number };
  refund: { amount: number | null; bookings: number };
  statuses: { key: StatusKey; count: number }[];
  methods: { label: string; amount: number }[];
}

const props = defineProps<{ data: FinanceData }>();

const meta: Record<StatusKey, { label: string; dot: string }> = {
  paid: { label: "Lunas", dot: "bg-success" },
  pending: { label: "Menunggu", dot: "bg-muted-foreground/40" },
  cancelled: { label: "Dibatalkan", dot: "bg-warning" },
  expired: { label: "Kedaluwarsa", dot: "bg-muted-foreground/70" },
  review: { label: "Perlu diperiksa", dot: "bg-danger" },
};

const v = computed(() => props.data);

const money = computed(() => [
  {
    label: "Terealisasi",
    value: formatMoney(v.value.realized.amount),
    note: `${v.value.realized.bookings} lunas`,
  },
  {
    label: "Menunggu bayar",
    value: formatMoney(v.value.pending.amount),
    note: `${v.value.pending.bookings} booking`,
  },
  {
    label: "Refund",
    value:
      v.value.refund.amount === null
        ? "Tidak tersedia"
        : formatMoney(v.value.refund.amount),
    note:
      v.value.refund.amount === null
        ? "Belum ada data refund"
        : `${v.value.refund.bookings} booking`,
  },
]);

const statuses = computed(() =>
  v.value.statuses.map((s) => ({ ...s, ...meta[s.key] })),
);

const methods = computed(() => {
  const total = v.value.methods.reduce((a, m) => a + m.amount, 0);
  return [...v.value.methods]
    .sort((a, b) => b.amount - a.amount)
    .map((m) => ({
      label: m.label,
      amount: formatMoney(m.amount),
      pct: total > 0 ? formatNumber((m.amount / total) * 100) : "0",
    }));
});
</script>

<template>
  <DashboardCardShell
    title="Keuangan"
    description="Dihitung dari booking lunas"
  >
    <dl class="grid grid-cols-3 gap-4">
      <div v-for="m in money" :key="m.label" class="min-w-0">
        <dt class="text-xs text-muted-foreground">{{ m.label }}</dt>
        <dd class="truncate text-lg font-semibold tabular-nums sm:text-xl">
          {{ m.value }}
        </dd>
        <dd class="text-xs text-muted-foreground">{{ m.note }}</dd>
      </div>
    </dl>

    <div class="mt-5 grid gap-6 border-t pt-5 sm:grid-cols-2">
      <div>
        <h3
          class="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          Status booking
        </h3>
        <ul class="flex flex-col gap-2 text-sm">
          <li
            v-if="methods.length === 0"
            class="text-muted-foreground"
          >
            Belum ada pendapatan lunas pada filter ini.
          </li>
          <li
            v-for="s in statuses"
            :key="s.key"
            class="flex items-center justify-between gap-2"
          >
            <span class="flex items-center gap-2">
              <span class="size-2 rounded-full" :class="s.dot" />{{ s.label }}
            </span>
            <span class="font-medium tabular-nums">{{ s.count }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h3
          class="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
        >
          Metode bayar
        </h3>
        <ul class="flex flex-col gap-2 text-sm">
          <li
            v-for="m in methods"
            :key="m.label"
            class="flex items-center justify-between gap-2"
          >
            <span>{{ m.label }}</span>
            <span class="tabular-nums">
              <span class="font-medium">{{ m.amount }}</span>
              <span class="text-muted-foreground"> · {{ m.pct }}%</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </DashboardCardShell>
</template>
