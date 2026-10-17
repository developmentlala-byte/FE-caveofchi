<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { PhImage, PhUploadSimple, PhX } from "@phosphor-icons/vue";
import { Label } from "@/components/ui/label";
import FieldHint from "~/components/FieldHint.vue";

const props = defineProps<{ currentUrl?: string | null }>();
const file = defineModel<File | null>({ default: null });

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const input = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const error = ref("");
const isDragging = ref(false);

watch(
  file,
  (value) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = value ? URL.createObjectURL(value) : null;
    if (!value && input.value) input.value.value = "";
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

const src = computed(() => previewUrl.value ?? props.currentUrl ?? null);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const caption = computed(() =>
  file.value
    ? `${file.value.name} · ${formatSize(file.value.size)}`
    : "Cover saat ini",
);

const setFile = (next?: File | null) => {
  error.value = "";
  if (!next) return;
  if (!ALLOWED_TYPES.includes(next.type)) {
    error.value = "Format harus JPG, PNG, atau WebP.";
    return;
  }
  if (next.size > MAX_FILE_SIZE) {
    error.value = "Ukuran file melebihi 10 MB.";
    return;
  }
  file.value = next;
};

const onChange = (e: Event) => {
  const el = e.target as HTMLInputElement;
  setFile(el.files?.[0]);
  el.value = "";
};
const onDrop = (e: DragEvent) => {
  isDragging.value = false;
  setFile(e.dataTransfer?.files?.[0]);
};
const pick = () => input.value?.click();
const clear = () => {
  error.value = "";
  file.value = null;
};
</script>

<template>
  <div class="grid gap-2">
    <div class="flex items-center gap-1.5">
      <Label>Cover</Label>
      <FieldHint
        text="Gambar utama. Format JPG, PNG, atau WebP, maksimal 10 MB."
      />
    </div>

    <input
      ref="input"
      type="file"
      class="sr-only"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      @change="onChange"
    />

    <div
      class="relative aspect-[16/7] overflow-hidden rounded-lg border transition-colors"
      :class="[
        src ? 'bg-muted' : 'border-dashed bg-muted/30 hover:bg-muted/50',
        isDragging && 'border-primary bg-muted/50',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <template v-if="src">
        <img :src="src" alt="Cover" class="size-full object-cover" />
        <p
          class="absolute inset-x-0 bottom-0 truncate bg-black/50 px-3 py-1.5 text-xs text-white"
        >
          {{ caption }}
        </p>
        <div class="absolute top-2 right-2 flex gap-1.5">
          <button
            type="button"
            aria-label="Ganti cover"
            class="flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="pick"
          >
            <PhUploadSimple :size="16" />
          </button>
          <button
            v-if="file"
            type="button"
            aria-label="Batalkan file yang dipilih"
            class="flex size-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="clear"
          >
            <PhX :size="16" />
          </button>
        </div>
      </template>

      <button
        v-else
        type="button"
        class="flex size-full flex-col items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
        @click="pick"
      >
        <PhImage :size="26" />
        Pilih atau seret gambar
      </button>
    </div>

    <p v-if="error" class="text-xs text-destructive" role="alert">
      {{ error }}
    </p>
  </div>
</template>
