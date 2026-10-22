<script setup lang="ts">
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const money = ["Terealisasi", "Menunggu bayar", "Refund"];
const statuses = [
  { label: "Lunas", dot: "bg-success" },
  { label: "Menunggu", dot: "bg-muted-foreground/40" },
  { label: "Dibatalkan", dot: "bg-warning" },
  { label: "Kedaluwarsa", dot: "bg-muted-foreground/70" },
  { label: "Perlu diperiksa", dot: "bg-danger" },
];
const h3 =
  "mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
</script>

<template>
  <DashboardCardShell
    title="Keuangan"
    description="Dihitung dari booking lunas"
    aria-hidden="true"
  >
    <dl class="grid grid-cols-3 gap-4">
      <div v-for="label in money" :key="label" class="min-w-0">
        <dt class="text-xs text-muted-foreground">{{ label }}</dt>
        <dd><SkLine size="xl" class="w-4/5" /></dd>
        <dd><SkLine size="xs" class="w-2/3" /></dd>
      </div>
    </dl>
    <div class="mt-5 grid gap-6 border-t pt-5 sm:grid-cols-2">
      <div>
        <h3 :class="h3">Status booking</h3>
        <ul class="flex flex-col gap-2 text-sm">
          <li
            v-for="status in statuses"
            :key="status.label"
            class="flex items-center justify-between gap-2"
          >
            <span class="flex items-center gap-2">
              <span class="size-2 rounded-full" :class="status.dot" />{{
                status.label
              }}
            </span>
            <SkLine size="sm" class="w-6" />
          </li>
        </ul>
      </div>
      <div>
        <h3 :class="h3">Metode bayar</h3>
        <ul class="flex flex-col gap-2 text-sm">
          <li
            v-for="width in ['w-20', 'w-28', 'w-24']"
            :key="width"
            class="flex items-center justify-between gap-2"
          >
            <SkLine size="sm" :class="width" />
            <SkLine size="sm" class="w-28" />
          </li>
        </ul>
      </div>
    </div>
  </DashboardCardShell>
</template>
