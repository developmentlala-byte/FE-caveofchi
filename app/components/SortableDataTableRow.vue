<script setup lang="ts">
import { ref, watch, type ComponentPublicInstance } from "vue";

interface ReorderPayload {
  sourceId: string;
  targetId: string;
  sourceIndex: number;
  targetIndex: number;
}

const props = defineProps<{
  id: string;
  index: number;
  disabled: boolean;
  clickable: boolean;
  getTargetId: (index: number) => string | undefined;
}>();

const emit = defineEmits<{ "row-reorder": [payload: ReorderPayload] }>();

const handleElement = ref<HTMLElement | null>(null);
const isDragging = ref(false);

function setHandleRef(element: Element | ComponentPublicInstance | null) {
  handleElement.value =
    typeof HTMLElement !== "undefined" && element instanceof HTMLElement
      ? element
      : null;
  syncHandle();
}

function syncHandle() {
  if (handleElement.value) {
    handleElement.value.draggable = !props.disabled;
    handleElement.value.dataset.rowDragHandle = "";
  }
}

watch(() => props.disabled, syncHandle);

function isDragHandle(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-row-drag-handle]"))
  );
}

function handleDragStart(event: DragEvent) {
  if (props.disabled || !isDragHandle(event.target) || !event.dataTransfer) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "application/x-data-table-row",
    JSON.stringify({ id: props.id, index: props.index }),
  );
  isDragging.value = true;
}

function handleDragOver(event: DragEvent) {
  if (
    !props.disabled &&
    event.dataTransfer?.types.includes("application/x-data-table-row")
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }
}

function handleDrop(event: DragEvent) {
  if (props.disabled || !event.dataTransfer) return;
  const raw = event.dataTransfer.getData("application/x-data-table-row");
  if (!raw) return;

  let source: { id?: unknown; index?: unknown };
  try {
    source = JSON.parse(raw);
  } catch {
    return;
  }

  if (
    typeof source.id !== "string" ||
    typeof source.index !== "number" ||
    !Number.isInteger(source.index) ||
    source.id === props.id
  ) {
    return;
  }

  event.preventDefault();
  emit("row-reorder", {
    sourceId: source.id,
    targetId: props.id,
    sourceIndex: source.index,
    targetIndex: props.index,
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled || !isDragHandle(event.target)) return;
  const targetIndex =
    event.key === "ArrowUp"
      ? props.index - 1
      : event.key === "ArrowDown"
        ? props.index + 1
        : -1;

  if (targetIndex < 0) return;
  const targetId = props.getTargetId(targetIndex);
  if (!targetId) return;
  event.preventDefault();
  emit("row-reorder", {
    sourceId: props.id,
    targetId,
    sourceIndex: props.index,
    targetIndex,
  });
}

function handleDragEnd() {
  isDragging.value = false;
}
</script>

<template>
  <tr
    data-slot="table-row"
    :data-dragging="isDragging"
    :class="[
      clickable ? 'cursor-pointer' : '',
      'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors relative data-[dragging=true]:z-10 data-[dragging=true]:border-primary data-[dragging=true]:opacity-70',
    ]"
    @dragstart="handleDragStart"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragend="handleDragEnd"
    @keydown="handleKeydown"
  >
    <slot :handle-ref="setHandleRef" :is-dragging="isDragging" />
  </tr>
</template>
