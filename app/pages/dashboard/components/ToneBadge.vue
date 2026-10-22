<script setup lang="ts">
type Tone = "good" | "warn" | "bad" | "neutral" | "brand";

withDefaults(defineProps<{ tone?: Tone }>(), { tone: "neutral" });

const toneClass: Record<Tone, string> = {
  good: "bg-success/15 text-[color:color-mix(in_oklch,var(--success)_45%,var(--foreground))]",
  warn: "bg-warning/15 text-[color:color-mix(in_oklch,var(--warning)_45%,var(--foreground))]",
  bad: "bg-danger/10 text-[color:color-mix(in_oklch,var(--danger)_45%,var(--foreground))]",
  brand:
    "bg-primary/10 text-[color:color-mix(in_oklch,var(--accent)_70%,var(--foreground))]",
  neutral: "bg-muted text-muted-foreground",
};
</script>

<template>
  <span
    class="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
    :class="toneClass[tone]"
  >
    <slot />
  </span>
</template>
