<script setup lang="ts">
import { useSortable } from "dnd-kit-vue";

const props = defineProps<{
  id: string;
  index: number;
  disabled: boolean;
  clickable: boolean;
}>();

const { elementRef, handleRef, isDragging } = useSortable(() => ({
  id: props.id,
  index: props.index,
  group: "data-table-rows",
  disabled: props.disabled,
  transition: { idle: true },
}));
</script>

<template>
  <tr
    :ref="elementRef"
    data-slot="table-row"
    :data-dragging="isDragging"
    :class="[
      clickable ? 'cursor-pointer' : '',
      'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors relative data-[dragging=true]:z-10 data-[dragging=true]:border-primary data-[dragging=true]:opacity-70',
    ]"
  >
    <slot :handle-ref="handleRef" :is-dragging="isDragging" />
  </tr>
</template>
