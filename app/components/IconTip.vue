<script setup lang="ts">
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

defineProps<{
  text: string;
  side?: "top" | "right" | "bottom" | "left";
}>();
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent :side="side" class="max-w-64">
      <slot name="content">{{ text }}</slot>
    </TooltipContent>
  </Tooltip>
</template>
