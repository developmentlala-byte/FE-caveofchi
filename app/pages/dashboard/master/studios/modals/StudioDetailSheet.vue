<script setup lang="ts">
import { PhImages, PhPencilSimple } from "@phosphor-icons/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ImageDropzone from "~/components/ImageDropzone.vue";
import type { Studio, StudioImage, StudioStatus } from "../type/studio.types";

defineProps<{
  studio: Studio | null;
  galleryImages: StudioImage[];
  galleryLoading: boolean;
  galleryError: boolean;
  uploadingImages: boolean;
}>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{
  edit: [studio: Studio];
  refreshGallery: [];
  uploadImages: [images: File[]];
}>();

const statusLabel: Record<StudioStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  maintenance: "Maintenance",
};

const statusDot: Record<StudioStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-muted-foreground/50",
  maintenance: "bg-amber-500",
};

const handleEdit = (value: Studio) => {
  open.value = false;
  emit("edit", value);
};
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 text-foreground sm:max-w-xl"
    >
      <!-- Kosong -->
      <template v-if="!studio">
        <SheetHeader class="p-6 text-left">
          <SheetTitle>Detail studio</SheetTitle>
          <SheetDescription>Tidak ada studio yang dipilih.</SheetDescription>
        </SheetHeader>
      </template>

      <template v-else>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pt-12 pb-6">
          <div class="grid gap-6">
            <!-- Cover -->
            <div
              class="aspect-[16/8] overflow-hidden rounded-xl border bg-muted"
            >
              <img
                v-if="studio.cover_image_url"
                :src="studio.cover_image_url"
                :alt="`Cover ${studio.name}`"
                class="size-full object-cover"
              />
              <div
                v-else
                class="flex size-full items-center justify-center text-4xl font-semibold text-muted-foreground/60"
                aria-hidden="true"
              >
                {{ studio.name.slice(0, 2).toUpperCase() }}
              </div>
            </div>

            <!-- Judul -->
            <SheetHeader class="gap-1.5 p-0 text-left">
              <div class="flex items-start justify-between gap-3">
                <SheetTitle class="text-xl leading-tight font-semibold">
                  {{ studio.name }}
                </SheetTitle>
                <Badge variant="secondary" class="shrink-0 gap-1.5 font-normal">
                  <span
                    class="size-1.5 rounded-full"
                    :class="statusDot[studio.status]"
                    aria-hidden="true"
                  />
                  {{ statusLabel[studio.status] }}
                </Badge>
              </div>
              <SheetDescription>
                {{ studio.short_description || "Tidak ada deskripsi singkat." }}
              </SheetDescription>
            </SheetHeader>

            <!-- Info utama -->
            <dl class="divide-y rounded-xl border text-sm">
              <div class="flex items-center justify-between gap-4 px-4 py-3">
                <dt class="text-muted-foreground">Kapasitas</dt>
                <dd class="font-medium">{{ studio.max_capacity }} orang</dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-4 py-3">
                <dt class="text-muted-foreground">Kode</dt>
                <dd class="font-medium">{{ studio.code }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-4 py-3">
                <dt class="text-muted-foreground">Slug</dt>
                <dd class="min-w-0 truncate font-medium" :title="studio.slug">
                  {{ studio.slug }}
                </dd>
              </div>
            </dl>

            <!-- Deskripsi -->
            <section class="grid gap-2">
              <h3 class="text-sm font-medium">Deskripsi</h3>
              <p
                class="text-sm leading-6 whitespace-pre-wrap"
                :class="studio.description ? '' : 'text-muted-foreground'"
              >
                {{ studio.description || "Belum ada deskripsi." }}
              </p>
            </section>

            <!-- Galeri -->
            <section aria-labelledby="studio-gallery-title" class="grid gap-3">
              <div class="flex items-center justify-between">
                <h3 id="studio-gallery-title" class="text-sm font-medium">
                  Galeri
                </h3>
                <span class="text-xs text-muted-foreground tabular-nums">
                  {{
                    galleryError
                      ? (studio.images_count ?? 0)
                      : galleryImages.length
                  }}
                  foto
                </span>
              </div>
              <ImageDropzone
                :disabled="uploadingImages"
                accept="image/jpeg,image/webp,.jpg,.webp"
                :allowed-extensions="['jpg', 'webp']"
                @files="emit('uploadImages', $event)"
              />

              <div
                v-if="galleryLoading"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4"
                aria-label="Memuat galeri"
              >
                <div
                  v-for="item in 4"
                  :key="item"
                  class="aspect-square animate-pulse rounded-lg bg-muted"
                />
              </div>

              <div
                v-else-if="galleryImages.length"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4"
              >
                <a
                  v-for="image in galleryImages"
                  :key="image.id"
                  :href="image.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="aspect-square overflow-hidden rounded-lg border bg-muted transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <img
                    :src="image.url"
                    :alt="image.alt_text || `Foto galeri ${studio.name}`"
                    class="size-full object-cover"
                    loading="lazy"
                  />
                </a>
              </div>

              <div
                v-else-if="galleryError"
                class="rounded-lg border bg-muted/30 px-4 py-5 text-center"
              >
                <p class="text-sm text-muted-foreground">
                  Galeri tidak dapat dimuat.
                </p>
                <Button
                  variant="link"
                  class="mt-1 h-auto p-0"
                  @click="emit('refreshGallery')"
                >
                  Coba lagi
                </Button>
              </div>

              <div
                v-else
                class="flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground"
              >
                <PhImages :size="18" />
                Belum ada foto galeri.
              </div>
            </section>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t px-6 py-4">
          <Button class="w-full gap-2" @click="handleEdit(studio)">
            <PhPencilSimple :size="16" />
            Edit studio
          </Button>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
