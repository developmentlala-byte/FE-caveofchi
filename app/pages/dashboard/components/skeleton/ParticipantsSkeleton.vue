<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCardShell from "../CardShell.vue";
import SkLine from "./SkLine.vue";
</script>

<template>
  <DashboardCardShell
    title="Peserta"
    description="Frekuensi booking per peserta pada periode yang dipilih"
    aria-hidden="true"
  >
    <div class="flex h-9 items-center gap-2">
      <Skeleton class="h-7 w-20" />
      <span class="text-sm text-muted-foreground">peserta unik</span>
    </div>
    <Skeleton class="mt-4 h-2 w-full rounded-full" />
    <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="size-2 rounded-full bg-primary" />1 booking
        </dt>
        <dd><SkLine size="sm" class="w-10" /></dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="size-2 rounded-full bg-primary/25" />Berulang
        </dt>
        <dd><SkLine size="sm" class="w-16" /></dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">Booking / peserta</dt>
        <dd><SkLine size="sm" class="w-8" /></dd>
      </div>
    </dl>
  </DashboardCardShell>
</template>
