<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

const props = withDefaults(
  defineProps<{ size?: Size; class?: HTMLAttributes["class"] }>(),
  { size: "sm" },
);

const box: Record<Size, string> = {
  xs: "h-4",
  sm: "h-5",
  base: "h-6",
  lg: "h-7",
  xl: "h-7",
  "2xl": "h-8",
  "3xl": "h-9",
};

const bar: Record<Size, string> = {
  xs: "h-2.5",
  sm: "h-3",
  base: "h-3.5",
  lg: "h-4",
  xl: "h-4",
  "2xl": "h-4.5",
  "3xl": "h-5",
};
</script>

<template>
  <div :class="cn('flex items-center', box[size], props.class)">
    <Skeleton :class="cn('w-full', bar[size])" />
  </div>
</template>
