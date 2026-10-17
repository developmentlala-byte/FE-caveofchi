<script setup lang="ts">
import { ref, watch } from "vue";
import type { StudioFormValues } from "../type/studio.types.ts";
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
defineProps<{ loading: boolean }>();
const emit = defineEmits<{ submit: [values: StudioFormValues] }>();

const emptyForm = (): StudioFormValues => ({
  name: "",
  status: "active",
  description: "",
  short_description: "",
  max_capacity: 1,
  cover_image: null,
  gallery_images: [],
});
const form = ref<StudioFormValues>(emptyForm());

watch(open, (isOpen) => {
  if (isOpen) form.value = emptyForm();
});

const submit = () => emit("submit", { ...form.value });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
    >
      <DialogHeader class="px-6 pt-6 pb-4 text-left">
        <DialogTitle>Tambah studio</DialogTitle>
        <DialogDescription>
          Isi informasi studio baru. Semua data bisa diubah kapan saja.
        </DialogDescription>
      </DialogHeader>

      <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
        <div class="min-h-0 flex-1 overflow-y-auto border-y px-6 py-5">
          <StudioFormFields v-model="form" />
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
            {{ loading ? "Menyimpan..." : "Simpan studio" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
