<script setup lang="ts">
import { computed } from "vue";

type BarTone = "brand" | "warn" | "muted";

const props = withDefaults(
  defineProps<{ value: number; tone?: BarTone; label?: string }>(),
  {
    tone: "brand",
    label: undefined,
  },
);

const clamped = computed(() => Math.min(100, Math.max(0, props.value)));

const fillClass: Record<BarTone, string> = {
  brand: "bg-primary",
  warn: "bg-warning",
  muted: "bg-muted-foreground/50",
};
</script>

<template>
  <div
    class="h-1.5 w-full overflow-hidden rounded-full bg-muted"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="clamped"
    :aria-label="label"
  >
    <div
      class="h-full rounded-full transition-[width] duration-500"
      :class="fillClass[tone]"
      :style="{ width: `${clamped}%` }"
    />
  </div>
</template>
