<script setup lang="ts">
import { PhInfo } from "@phosphor-icons/vue";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

defineProps<{ text: string }>();
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <button
        type="button"
        class="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        :aria-label="text"
      >
        <PhInfo :size="14" />
      </button>
    </TooltipTrigger>
    <TooltipContent class="max-w-60">{{ text }}</TooltipContent>
  </Tooltip>
</template>
