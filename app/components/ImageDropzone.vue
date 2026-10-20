<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    accept: string;
    allowedExtensions: string[];
    disabled?: boolean;
  }>(),
  { disabled: false },
);
const emit = defineEmits<{ files: [files: File[]] }>();

const isDragging = ref(false);
const validationMessage = ref("");
const maxFiles = 20;
const maxFileSize = 10 * 1024 * 1024;

const processFiles = (files: File[]) => {
  validationMessage.value = "";
  if (files.length > maxFiles) {
    validationMessage.value = `Pilih maksimal ${maxFiles} gambar sekaligus.`;
    return;
  }

  const allowedExtensions = new Set(
    props.allowedExtensions.map((extension) => extension.toLowerCase()),
  );
  const validFiles = files.filter((file) => {
    const extension = file.name.split(".").at(-1)?.toLowerCase();
    return (
      extension &&
      allowedExtensions.has(extension) &&
      file.size <= maxFileSize
    );
  });

  if (validFiles.length !== files.length) {
    validationMessage.value =
      "Sebagian file tidak dipilih. Pastikan format gambar sesuai dan ukuran tiap file maksimal 10 MB.";
  }
  if (validFiles.length > 0) emit("files", validFiles);
};

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  processFiles(Array.from(input.files ?? []));
  input.value = "";
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  if (props.disabled) return;
  processFiles(Array.from(event.dataTransfer?.files ?? []));
};
</script>

<template>
  <div
    class="grid gap-1 rounded-lg border border-dashed px-4 py-3 text-center transition-colors"
    :class="
      isDragging
        ? 'border-primary bg-primary/5 text-foreground'
        : 'text-muted-foreground'
    "
    @dragenter.prevent="!disabled && (isDragging = true)"
    @dragover.prevent="!disabled && (isDragging = true)"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <p class="text-sm">
      Seret dan lepas hingga {{ maxFiles }} gambar di sini, atau
      <label
        class="cursor-pointer font-medium text-primary underline-offset-4 hover:underline focus-within:rounded-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
        :class="disabled && 'pointer-events-none opacity-50'"
      >
        pilih file
        <input
          class="sr-only"
          type="file"
          :accept="accept"
          multiple
          :disabled="disabled"
          @change="handleInput"
        />
      </label>
    </p>
    <p class="text-xs">
      Format: {{ allowedExtensions.join(", ").toUpperCase() }} · Maks. 10 MB per
      gambar
    </p>
    <p v-if="validationMessage" class="text-xs text-destructive" role="alert">
      {{ validationMessage }}
    </p>
  </div>
</template>
