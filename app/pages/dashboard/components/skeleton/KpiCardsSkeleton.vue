<script setup lang="ts">
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

withDefaults(defineProps<{ count?: number }>(), { count: 5 });

const items = [
  {
    label: "Booking",
    note: "sesuai status dan periode",
    valueWidth: "w-2/5",
  },
  {
    label: "Pendapatan lunas",
    note: "pembayaran lunas pada periode",
    valueWidth: "w-4/5",
  },
  {
    label: "Kuota terisi",
    note: "dari sesi pada periode",
    valueWidth: "w-3/5",
  },
  {
    label: "Sesi 7 hari ke depan",
    note: "sesi draft atau dibuka",
    valueWidth: "w-1/3",
  },
  {
    label: "Batal/kedaluwarsa",
    note: "dari booking terfilter",
    valueWidth: "w-1/2",
  },
];
</script>

<template>
  <section
    aria-hidden="true"
    class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1"
  >
    <Card
      v-for="n in count"
      :key="n"
      class="min-w-0 gap-3 p-4 sm:p-5"
    >
      <p
        class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {{ items[(n - 1) % items.length]!.label }}
      </p>
      <div class="min-w-0" style="container-type: inline-size">
        <div
          class="flex items-center"
          style="height: 1.25em; font-size: clamp(1.125rem, 11cqw, 1.875rem)"
        >
          <Skeleton
            class="h-[0.8em]"
            :class="items[(n - 1) % items.length]!.valueWidth"
          />
        </div>
      </div>
      <div class="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        <span class="text-xs text-muted-foreground">
          {{ items[(n - 1) % items.length]!.note }}
        </span>
      </div>
    </Card>
  </section>
</template>
