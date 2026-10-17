<script setup lang="ts">
import { useSortableContext } from "dnd-kit-vue";
import { Button } from "@/components/ui/button";
import { PhDotsSixVertical } from "@phosphor-icons/vue";

const { handleRef, sortable } = useSortableContext();
</script>

<template>
  <Button
    :ref="handleRef"
    variant="ghost"
    size="icon"
    class="text-muted-foreground size-7 hover:bg-transparent"
  >
    <PhDotsSixVertical class="text-muted-foreground size-3" />
    <span class="sr-only">Drag to reorder</span>
  </Button>
</template>
