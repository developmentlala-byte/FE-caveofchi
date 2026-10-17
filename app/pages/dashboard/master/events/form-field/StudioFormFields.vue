<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  PhImage,
  PhImages,
  PhPlus,
  PhUploadSimple,
  PhX,
} from "@phosphor-icons/vue";
import type { StudioFormValues, StudioImage } from "../type/studio.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import FieldHint from "~/components/FieldHint.vue";

const props = withDefaults(defineProps<{
  coverImageUrl?: string | null;
  existingGalleryImages?: StudioImage[];
  galleryLoading?: boolean;
  galleryError?: boolean;
  deletingGalleryImageId?: number | null;
}>(), {
  existingGalleryImages: () => [],
  galleryLoading: false,
  galleryError: false,
  deletingGalleryImageId: null,
});

const form = defineModel<StudioFormValues>({ required: true });
const emit = defineEmits<{
  deleteGalleryImage: [image: StudioImage];
  refreshGallery: [];
}>();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_GALLERY_TYPES = ["image/jpeg", "image/webp"];
const MAX_GALLERY_IMAGES = 20;

const statusOptions = [
  { value: "active", label: "Aktif", dot: "bg-emerald-500" },
  { value: "inactive", label: "Nonaktif", dot: "bg-muted-foreground/50" },
  { value: "maintenance", label: "Maintenance", dot: "bg-amber-500" },
];
const currentStatus = computed(() =>
  statusOptions.find((s) => s.value === form.value.status),
);

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* ---------- Cover ---------- */
const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const coverError = ref("");
const isDragging = ref(false);

watch(
  () => form.value.cover_image,
  (file) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = file ? URL.createObjectURL(file) : null;
    if (!file && fileInput.value) fileInput.value.value = "";
  },
  { immediate: true },
);

const coverSrc = computed(
  () => previewUrl.value ?? props.coverImageUrl ?? null,
);
const coverCaption = computed(() =>
  form.value.cover_image
    ? `${form.value.cover_image.name} · ${formatSize(form.value.cover_image.size)}`
    : "Cover saat ini",
);

const setFile = (file?: File | null) => {
  coverError.value = "";
  if (!file) return;
  if (!ALLOWED_TYPES.includes(file.type)) {
    coverError.value = "Format harus JPG, PNG, atau WebP.";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    coverError.value = "Ukuran file melebihi 10 MB.";
    return;
  }
  form.value.cover_image = file;
};

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  setFile(input.files?.[0]);
  input.value = "";
};

const onDrop = (event: DragEvent) => {
  isDragging.value = false;
  setFile(event.dataTransfer?.files?.[0]);
};

const openPicker = () => fileInput.value?.click();
const clearFile = () => {
  coverError.value = "";
  form.value.cover_image = null;
};

/* ---------- Galeri ---------- */
const galleryFileInput = ref<HTMLInputElement | null>(null);
const galleryPreviews = ref<Array<{ file: File; url: string }>>([]);
const galleryError = ref("");
const isGalleryDragging = ref(false);

watch(
  () => form.value.gallery_images,
  (images) => {
    galleryPreviews.value.forEach(({ url }) => URL.revokeObjectURL(url));
    galleryPreviews.value = images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  galleryPreviews.value.forEach(({ url }) => URL.revokeObjectURL(url));
});

const addGalleryImages = (files: File[]) => {
  if (!files.length) return;
  if (props.galleryLoading || props.galleryError) {
    galleryError.value = props.galleryError
      ? "Muat ulang galeri sebelum menambahkan foto."
      : "Tunggu sampai galeri selesai dimuat.";
    return;
  }

  const unsupportedFile = files.find(
    (file) =>
      !/\.(jpg|webp)$/i.test(file.name) ||
      !ALLOWED_GALLERY_TYPES.includes(file.type),
  );
  if (unsupportedFile) {
    galleryError.value = `${unsupportedFile.name}: format harus JPG atau WebP.`;
    return;
  }

  const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFile) {
    galleryError.value = `${oversizedFile.name}: ukuran maksimal 10 MB.`;
    return;
  }

  const selectedImages = [...form.value.gallery_images, ...files];
  if (props.existingGalleryImages.length + selectedImages.length > MAX_GALLERY_IMAGES) {
    galleryError.value = "Maksimal 20 foto galeri per studio.";
    return;
  }

  galleryError.value = "";
  form.value.gallery_images = selectedImages;
};

const onGalleryFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  addGalleryImages(Array.from(input.files ?? []));
  input.value = "";
};

const onGalleryDrop = (event: DragEvent) => {
  isGalleryDragging.value = false;
  addGalleryImages(Array.from(event.dataTransfer?.files ?? []));
};

const openGalleryPicker = () => galleryFileInput.value?.click();

const removeGalleryImage = (index: number) => {
  form.value.gallery_images = form.value.gallery_images.filter(
    (_, imageIndex) => imageIndex !== index,
  );
  galleryError.value = "";
};
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <div class="grid gap-5">
      <!-- Cover -->
      <div class="grid gap-2">
        <div class="flex items-center gap-1.5">
          <Label>Cover</Label>
          <FieldHint
            text="Gambar utama studio. Format JPG, PNG, atau WebP, maksimal 10 MB."
          />
        </div>

        <input
          ref="fileInput"
          type="file"
          class="sr-only"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          @change="onFileChange"
        />

        <div
          class="relative aspect-16/7 overflow-hidden rounded-lg border transition-colors"
          :class="[
            coverSrc
              ? 'bg-muted'
              : 'border-dashed bg-muted/30 hover:bg-muted/50',
            isDragging && 'border-primary bg-muted/50',
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
        >
          <template v-if="coverSrc">
            <img
              :src="coverSrc"
              alt="Cover studio"
              class="size-full object-cover"
            />
            <p
              class="absolute inset-x-0 bottom-0 truncate bg-black/50 px-3 py-1.5 text-xs text-white"
            >
              {{ coverCaption }}
            </p>
            <div class="absolute top-2 right-2 flex gap-1.5">
              <button
                type="button"
                aria-label="Ganti cover"
                class="flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                @click="openPicker"
              >
                <PhUploadSimple :size="16" />
              </button>
              <button
                v-if="form.cover_image"
                type="button"
                aria-label="Batalkan file yang dipilih"
                class="flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                @click="clearFile"
              >
                <PhX :size="16" />
              </button>
            </div>
          </template>

          <button
            v-else
            type="button"
            class="flex size-full flex-col items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
            @click="openPicker"
          >
            <PhImage :size="26" />
            Pilih atau seret gambar
          </button>
        </div>

        <p v-if="coverError" class="text-xs text-destructive" role="alert">
          {{ coverError }}
        </p>
      </div>

      <!-- Nama -->
      <div class="grid gap-2">
        <Label for="studio-name">Nama studio</Label>
        <Input
          id="studio-name"
          v-model="form.name"
          required
          maxlength="100"
          placeholder="Contoh: Studio Garden"
        />
      </div>

      <!-- Status & kapasitas -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <div class="flex items-center gap-1.5">
            <Label for="studio-status">Status</Label>
            <FieldHint text="Hanya studio berstatus Aktif yang bisa dipesan." />
          </div>
          <Select v-model="form.status">
            <SelectTrigger id="studio-status" class="w-full">
              <div class="flex items-center gap-2">
                <span
                  class="size-2 rounded-full"
                  :class="currentStatus?.dot"
                  aria-hidden="true"
                />
                <SelectValue placeholder="Pilih status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <div class="flex items-center gap-1.5">
            <Label for="studio-capacity">Kapasitas</Label>
            <FieldHint
              text="Jumlah orang maksimum yang dapat ditampung studio."
            />
          </div>
          <NumberField
            id="studio-capacity"
            v-model="form.max_capacity"
            :min="1"
            :step="1"
          >
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>

      <!-- Deskripsi singkat -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <Label for="studio-short">Deskripsi singkat</Label>
            <FieldHint text="Ringkasan satu kalimat, maksimal 250 karakter." />
          </div>
          <span class="text-xs text-muted-foreground tabular-nums">
            {{ (form.short_description ?? "").length }}/250
          </span>
        </div>
        <Input
          id="studio-short"
          v-model="form.short_description"
          maxlength="250"
          placeholder="Ringkasan studio"
        />
      </div>

      <!-- Deskripsi lengkap -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <Label for="studio-desc">Deskripsi</Label>
            <FieldHint
              text="Jelaskan fasilitas, suasana, dan hal lain yang perlu diketahui. Maksimal 700 karakter."
            />
          </div>
          <span class="text-xs text-muted-foreground tabular-nums">
            {{ (form.description ?? "").length }}/700
          </span>
        </div>
        <Textarea
          id="studio-desc"
          v-model="form.description"
          maxlength="700"
          rows="4"
          class="resize-none"
          placeholder="Informasi lengkap tentang studio"
        />
      </div>

      <!-- Galeri -->
      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <Label>Foto galeri</Label>
            <FieldHint
              text="Maksimal 20 foto JPG atau WebP, ukuran maksimal 10 MB per foto."
            />
          </div>
          <span class="text-xs text-muted-foreground tabular-nums">
            {{ (existingGalleryImages?.length ?? 0) + galleryPreviews.length }}/{{ MAX_GALLERY_IMAGES }}
          </span>
        </div>

        <input
          ref="galleryFileInput"
          type="file"
          class="sr-only"
          accept=".jpg,.webp,image/jpeg,image/webp"
          multiple
          @change="onGalleryFileChange"
        />

        <div
          class="rounded-lg transition-colors"
          :class="isGalleryDragging && 'bg-muted/50 ring-2 ring-primary'"
          @dragover.prevent="isGalleryDragging = true"
          @dragleave="isGalleryDragging = false"
          @drop.prevent="onGalleryDrop"
        >
          <div v-if="galleryLoading" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div
              v-for="item in 4"
              :key="item"
              class="aspect-square animate-pulse rounded-md bg-muted"
            />
          </div>

          <p
            v-else-if="existingGalleryImages?.length"
            class="mb-2 text-xs font-medium text-muted-foreground"
          >
            Foto tersimpan
          </p>
          <div
            v-if="!galleryLoading && existingGalleryImages?.length"
            class="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            <div
              v-for="image in existingGalleryImages"
              :key="image.id"
              class="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <img
                :src="image.url"
                :alt="image.alt_text || 'Foto galeri studio'"
                class="size-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                :aria-label="`Hapus foto galeri ${image.id}`"
                :disabled="deletingGalleryImageId === image.id"
                class="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                @click="emit('deleteGalleryImage', image)"
              >
                <PhX :size="13" />
              </button>
            </div>
          </div>

          <div
            v-if="galleryError"
            class="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm"
            role="alert"
          >
            <p class="text-destructive">Galeri gagal dimuat.</p>
            <button
              type="button"
              class="mt-1 font-medium text-foreground underline underline-offset-4"
              @click="emit('refreshGallery')"
            >
              Coba muat ulang
            </button>
          </div>

          <p
            v-if="galleryPreviews.length"
            class="mb-2 text-xs font-medium text-muted-foreground"
          >
            Foto baru
          </p>
          <!-- Kosong -->
          <button
            v-if="!galleryPreviews.length && !existingGalleryImages.length && !galleryLoading && !galleryError"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="openGalleryPicker"
          >
            <PhImages :size="20" />
            Pilih atau seret foto
          </button>

          <!-- Grid thumbnail -->
          <div v-if="galleryPreviews.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div
              v-for="(preview, index) in galleryPreviews"
              :key="`${preview.file.name}-${preview.file.lastModified}-${index}`"
              class="group relative aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <img
                :src="preview.url"
                :alt="preview.file.name"
                class="size-full object-cover"
              />
              <button
                type="button"
                :aria-label="`Hapus ${preview.file.name}`"
                class="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:bg-background focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:opacity-0 sm:group-hover:opacity-100"
                @click="removeGalleryImage(index)"
              >
                <PhX :size="12" />
              </button>
            </div>

            <button
              v-if="existingGalleryImages.length + galleryPreviews.length < MAX_GALLERY_IMAGES"
              type="button"
              aria-label="Tambah foto galeri"
              class="flex aspect-square items-center justify-center rounded-md border border-dashed border-input text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              @click="openGalleryPicker"
            >
              <PhPlus :size="20" />
            </button>
          </div>
          <button
            v-if="existingGalleryImages.length && !galleryPreviews.length && existingGalleryImages.length < MAX_GALLERY_IMAGES && !galleryLoading && !galleryError"
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            @click="openGalleryPicker"
          >
            <PhPlus :size="16" />
            Tambah foto
          </button>
        </div>

        <p v-if="galleryError" class="text-xs text-destructive" role="alert">
          {{ galleryError }}
        </p>
      </div>
    </div>
  </TooltipProvider>
</template>
