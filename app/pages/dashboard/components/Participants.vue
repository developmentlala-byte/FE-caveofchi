<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "../utils/format";
import DashboardCardShell from "./CardShell.vue";

interface ParticipantsData {
  uniqueCount: number;
  singleBookingCount: number;
  returningCount: number;
  avgBookingsPerParticipant: number;
}

const props = defineProps<{ data: ParticipantsData }>();

const v = computed(() => props.data);
const returningPct = computed(() =>
  v.value.uniqueCount > 0
    ? Math.round((v.value.returningCount / v.value.uniqueCount) * 100)
    : 0,
);
</script>

<template>
  <DashboardCardShell
    title="Peserta"
    description="Frekuensi booking per peserta pada periode yang dipilih"
  >
    <p class="text-3xl font-semibold tracking-tight tabular-nums">
      {{ formatNumber(v.uniqueCount) }}
      <span class="text-sm font-normal text-muted-foreground"
        >peserta baru</span
      >
    </p>

    <div
      class="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full"
      role="img"
      :aria-label="`${returningPct}% peserta kembali`"
    >
      <div
        class="basis-0 bg-primary"
        :style="{ flexGrow: v.singleBookingCount }"
      />
      <div
        class="basis-0 bg-primary/25"
        :style="{ flexGrow: v.returningCount }"
      />
    </div>

    <dl class="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div>
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="size-2 rounded-full bg-primary" />1 booking
        </dt>
        <dd class="font-semibold tabular-nums">{{ v.singleBookingCount }}</dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span class="size-2 rounded-full bg-primary/25" />Berulang
        </dt>
        <dd class="font-semibold tabular-nums">
          {{ v.returningCount }} ({{ returningPct }}%)
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted-foreground">Booking / peserta</dt>
        <dd class="font-semibold tabular-nums">
          {{ formatNumber(v.avgBookingsPerParticipant) }}
        </dd>
      </div>
    </dl>
  </DashboardCardShell>
</template>
