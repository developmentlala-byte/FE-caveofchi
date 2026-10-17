<script setup lang="ts">
import { ref, watch } from "vue";
import type {
  Studio,
  StudioFormValues,
  StudioImage,
} from "../type/studio.types.ts";
import StudioFormFields from "../form-field/StudioFormFields.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  studio: Studio | null;
  loading: boolean;
  existingGalleryImages: StudioImage[];
  galleryLoading: boolean;
  galleryError: boolean;
  deletingGalleryImageId: number | null;
}>();
const emit = defineEmits<{
  submit: [values: StudioFormValues];
  deleteGalleryImage: [image: StudioImage];
  refreshGallery: [];
}>();

const form = ref<StudioFormValues>({
  name: "",
  status: "active",
  description: "",
  short_description: "",
  max_capacity: 1,
  cover_image: null,
  gallery_images: [],
});

watch(
  () => [open.value, props.studio] as const,
  ([isOpen, studio]) => {
    if (!isOpen || !studio) return;
    form.value = {
      name: studio.name,
      status: studio.status,
      description: studio.description ?? "",
      short_description: studio.short_description ?? "",
      max_capacity: studio.max_capacity,
      cover_image: null,
      gallery_images: [],
    };
  },
);

const submit = () => emit("submit", { ...form.value });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      v-if="studio"
      class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
    >
      <DialogHeader class="px-6 pt-6 pb-4 text-left">
        <DialogTitle>Edit studio</DialogTitle>
        <DialogDescription>
          Perbarui informasi {{ studio.name }}.
        </DialogDescription>
      </DialogHeader>

      <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
        <div class="min-h-0 flex-1 overflow-y-auto border-y px-6 py-5">
          <StudioFormFields
            v-model="form"
            :cover-image-url="studio.cover_image_url"
            :existing-gallery-images="existingGalleryImages"
            :gallery-loading="galleryLoading"
            :gallery-error="galleryError"
            :deleting-gallery-image-id="deletingGalleryImageId"
            @delete-gallery-image="emit('deleteGalleryImage', $event)"
            @refresh-gallery="emit('refreshGallery')"
          />
        </div>

        <DialogFooter class="px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            :disabled="loading"
            @click="open = false"
          >
            Batal
          </Button>
          <Button type="submit" :disabled="loading">
            <Spinner v-if="loading" />
            {{ loading ? "Menyimpan..." : "Simpan perubahan" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
