<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";

const names = ["w-44", "w-36", "w-40", "w-32", "w-28"];
const th =
  "px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground";
</script>

<template>
  <DashboardCardShell
    title="Performa event"
    description="Urut dari pendapatan tertinggi"
    aria-hidden="true"
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
          <tr v-for="(width, index) in names" :key="index">
            <td class="px-5 py-3.5"><SkLine size="sm" :class="width" /></td>
            <td class="px-5 py-3.5">
              <SkLine size="sm" class="ml-auto w-5" />
            </td>
            <td class="px-5 py-3.5">
              <SkLine size="sm" class="ml-auto w-7" />
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <Skeleton class="h-1.5 flex-1 rounded-full" />
                <SkLine size="xs" class="w-9" />
              </div>
            </td>
            <td class="px-5 py-3.5">
              <SkLine size="sm" class="ml-auto w-24" />
            </td>
          </tr>
        </tbody>
        <tfoot class="border-t bg-muted/60 text-sm font-semibold">
          <tr>
            <td class="px-5 py-3">Total</td>
            <td class="px-5 py-3">
              <SkLine size="sm" class="ml-auto w-5" />
            </td>
            <td class="px-5 py-3">
              <SkLine size="sm" class="ml-auto w-7" />
            </td>
            <td class="px-5 py-3"><SkLine size="sm" class="w-9" /></td>
            <td class="px-5 py-3">
              <SkLine size="sm" class="ml-auto w-24" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </DashboardCardShell>
</template>
