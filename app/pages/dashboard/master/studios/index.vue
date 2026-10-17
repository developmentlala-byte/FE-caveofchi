<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import { PhEye, PhPencilSimple, PhPlus, PhTrash } from "@phosphor-icons/vue";
import { toast } from "vue-sonner";
import DataTable from "~/components/DataTable.vue";
import type { DataTableFeatures } from "~/components/dataTableFeatures";
import { useApiDelete, useApiPost } from "~/composables/useApiMutation";
import { useApiQuery } from "~/composables/useApiQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CreateStudioModal from "./modals/CreateStudioModal.vue";
import EditStudioModal from "./modals/EditStudioModal.vue";
import StudioDetailSheet from "./modals/StudioDetailSheet.vue";
import StudiosFilterToolbar from "./components/StudiosFilterToolbar.vue";
import type {
  ApiEnvelope,
  Studio,
  StudioFormValues,
  StudioImage,
  StudioStatus,
} from "./type/studio.types";

definePageMeta({ layout: "dashboard" });
useHead({ title: "Studio" });

const STATUS_LABEL: Record<StudioStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  maintenance: "Maintenance",
};

const STATUS_CLASS: Record<StudioStatus, string> = {
  active: "border-transparent bg-primary/10 text-primary",
  inactive: "border-transparent bg-muted text-muted-foreground",
  maintenance: "border-transparent bg-accent text-accent-foreground",
};

const searchInput = ref("");
const search = ref("");
const status = ref<"all" | StudioStatus>("all");
const capacity = ref<"" | "5" | "10" | "15">("");
const pageIndex = ref(0);
const pageSize = ref(10);

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    search.value = value.trim();
  }, 400);
});
onScopeDispose(() => clearTimeout(searchTimer));

watch([search, status, capacity], () => {
  pageIndex.value = 0;
});

const queryParams = computed(() => ({
  page: pageIndex.value + 1,
  per_page: pageSize.value,
  ...(search.value ? { search: search.value } : {}),
  ...(status.value !== "all" ? { status: status.value } : {}),
  ...(capacity.value ? { min_capacity: Number(capacity.value) } : {}),
}));

const studiosQuery = useApiQuery<ApiEnvelope<Studio[]>>({
  queryKey: computed(() => ["studios", queryParams.value]),
  url: "/master/studio",
  params: queryParams,
  options: { enabled: import.meta.client },
});

const studios = computed(() => studiosQuery.data.value?.data ?? []);
const meta = computed(() => studiosQuery.data.value?.meta);

const columnHelper = createColumnHelper<DataTableFeatures, Studio>();
const columns = columnHelper.columns([
  columnHelper.display({
    id: "no",
    header: "No",
    size: 64,
    minSize: 48,
    maxSize: 72,
    enableSorting: false,
  }),
  columnHelper.accessor("name", { header: "Studio", size: 220, minSize: 170 }),
  columnHelper.accessor("short_description", {
    header: "Deskripsi singkat",
    size: 240,
    minSize: 180,
  }),
  columnHelper.accessor("max_capacity", {
    header: "Kapasitas",
    size: 125,
    minSize: 100,
  }),
  columnHelper.accessor("images_count", {
    header: "Foto",
    size: 90,
    minSize: 72,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 130,
    minSize: 110,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    size: 132,
    minSize: 120,
    enableSorting: false,
  }),
]);

const createOpen = ref(false);
const detailOpen = ref(false);
const selectedStudio = ref<Studio | null>(null);
const editingStudio = ref<Studio | null>(null);
const editOpen = computed({
  get: () => editingStudio.value !== null,
  set: (open: boolean) => {
    if (!open) editingStudio.value = null;
  },
});

const galleryStudioId = computed(
  () => editingStudio.value?.id ?? selectedStudio.value?.id ?? null,
);
const galleryQuery = useApiQuery<ApiEnvelope<StudioImage[]>>({
  queryKey: computed(() => ["studio-images", galleryStudioId.value]),
  url: "/master/studio/list-image",
  params: computed(() => ({
    studio_id: galleryStudioId.value,
    per_page: 100,
  })),
  options: {
    enabled: computed(
      () => import.meta.client && galleryStudioId.value !== null,
    ),
  },
});
const galleryImages = computed(() => galleryQuery.data.value?.data ?? []);
const deletingGalleryImageId = ref<number | null>(null);

const createStudio = useApiPost<ApiEnvelope<Studio>, FormData>({
  url: "/master/studio",
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [["studios"], ["studio-images"]],
});

const uploadStudioGallery = useApiPost<ApiEnvelope<unknown[]>, FormData>({
  url: "/master/studio/list-image/bulk",
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [["studios"], ["studio-images"]],
});

const updateStudio = useApiPost<
  ApiEnvelope<Studio>,
  { id: number; formData: FormData }
>({
  url: ({ id }) => `/master/studio/${id}`,
  body: ({ formData }) => formData,
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [
    ["studios"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});

const deleteStudio = useApiDelete<ApiEnvelope<null>, number>({
  url: (id) => `/master/studio/${id}`,
  invalidateKeys: [
    ["studios"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});

const deleteStudioImage = useApiDelete<ApiEnvelope<null>, number>({
  url: (id) => `/master/studio/list-image/${id}`,
  invalidateKeys: [["studios"], ["studio-images"]],
});

const toFormData = (values: StudioFormValues, update = false) => {
  const formData = new FormData();
  if (update) formData.append("_method", "PUT");
  formData.append("name", values.name);
  formData.append("status", values.status);
  formData.append("description", values.description);
  formData.append("short_description", values.short_description);
  formData.append("max_capacity", String(values.max_capacity));
  if (values.cover_image) formData.append("cover_image", values.cover_image);
  return formData;
};

const toGalleryFormData = (studioId: number, images: File[]) => {
  const formData = new FormData();
  formData.append("studio_id", String(studioId));
  images.forEach((image) => formData.append("images[]", image));
  return formData;
};

const handleCreate = async (values: StudioFormValues) => {
  const response = await createStudio.mutateAsync(toFormData(values));
  createOpen.value = false;

  if (values.gallery_images.length) {
    try {
      await uploadStudioGallery.mutateAsync(
        toGalleryFormData(response.data.id, values.gallery_images),
      );
    } catch (error) {
      const reason = error instanceof Error ? ` ${error.message}` : "";
      toast.error(
        `Studio berhasil dibuat, tetapi foto galeri gagal diunggah.${reason} Tambahkan kembali foto melalui Edit Studio.`,
      );
      return;
    }
  }

  toast.success("Studio dan foto galeri berhasil disimpan.");
};

const handleUpdate = async (values: StudioFormValues) => {
  const studio = editingStudio.value;
  if (!studio) return;
  await updateStudio.mutateAsync({
    id: studio.id,
    formData: toFormData(values, true),
  });

  if (values.gallery_images.length) {
    try {
      await uploadStudioGallery.mutateAsync(
        toGalleryFormData(studio.id, values.gallery_images),
      );
    } catch (error) {
      const reason = error instanceof Error ? ` ${error.message}` : "";
      toast.error(
        `Informasi studio berhasil diperbarui, tetapi foto galeri gagal diunggah.${reason}`,
      );
      return;
    }
  }

  editingStudio.value = null;
  toast.success("Studio berhasil diperbarui.");
};

const handleDeleteGalleryImage = async (image: StudioImage) => {
  if (
    !window.confirm(
      "Hapus foto ini dari galeri studio? Tindakan ini tidak bisa dibatalkan.",
    )
  ) {
    return;
  }

  deletingGalleryImageId.value = image.id;
  try {
    await deleteStudioImage.mutateAsync(image.id);
    toast.success("Foto galeri berhasil dihapus.");
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    toast.error(`Foto galeri gagal dihapus.${reason}`);
  } finally {
    deletingGalleryImageId.value = null;
  }
};

const handleDelete = async (studio: Studio) => {
  if (
    !window.confirm(
      `Hapus studio "${studio.name}"? Tindakan ini tidak bisa dibatalkan.`,
    )
  ) {
    return;
  }
  await deleteStudio.mutateAsync(studio.id);
  if (selectedStudio.value?.id === studio.id) {
    selectedStudio.value = null;
    detailOpen.value = false;
  }
  toast.success("Studio berhasil dihapus.");
};

const openDetails = (studio: Studio) => {
  selectedStudio.value = studio;
  detailOpen.value = true;
};

const formatCapacity = (capacity: number) => `${capacity} orang`;
</script>

<template>
  <section
    class="flex min-h-full w-full flex-col gap-5 bg-background px-4 py-6 text-foreground md:px-8 md:py-8"
  >
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Studio</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Kelola informasi, kapasitas, dan status studio.
        </p>
      </div>
      <Button class="h-10 gap-2 rounded-xl px-4" @click="createOpen = true">
        <PhPlus class="size-4" weight="bold" />
        Tambah Studio
      </Button>
    </header>

    <StudiosFilterToolbar
      v-model:search-input="searchInput"
      v-model:status="status"
      v-model:capacity="capacity"
    />

    <DataTable
      :columns="columns"
      :data="studios"
      :default-page-size="pageSize"
      :is-loading="studiosQuery.isPending.value"
      :empty-message="
        studiosQuery.isError.value
          ? 'Data studio gagal dimuat. Periksa koneksi lalu coba lagi.'
          : 'Studio tidak ditemukan.'
      "
      clickable
      manual-pagination
      :page-count="meta?.last_page ?? 0"
      :page-index="pageIndex"
      :total-rows="meta?.total ?? 0"
      @row-click="openDetails"
      @page-change="(nextPage) => (pageIndex = nextPage)"
      @page-size-change="(nextPageSize) => (pageSize = nextPageSize)"
    >
      <template #cell-no="{ rowNumber }">
        {{ rowNumber }}
      </template>

      <template #cell-name="{ row }">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-semibold text-muted-foreground"
          >
            <img
              v-if="row.original.cover_image_url"
              :src="row.original.cover_image_url"
              :alt="`Cover ${row.original.name}`"
              class="size-full object-cover"
              loading="lazy"
            />
            <span v-else aria-hidden="true">
              {{ row.original.name.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0">
            <p class="truncate font-medium text-foreground">
              {{ row.original.name }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ row.original.code }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-short_description="{ row }">
        <span class="line-clamp-2 text-sm text-muted-foreground">
          {{
            row.original.short_description || row.original.description || "—"
          }}
        </span>
      </template>

      <template #cell-max_capacity="{ row }">
        {{ formatCapacity(row.original.max_capacity) }}
      </template>

      <template #cell-images_count="{ row }">
        {{ row.original.images_count ?? 0 }}
      </template>

      <template #cell-status="{ row }">
        <Badge variant="outline" :class="STATUS_CLASS[row.original.status]">
          {{ STATUS_LABEL[row.original.status] }}
        </Badge>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-2" @click.stop>
          <Button
            size="icon"
            variant="outline"
            class="size-8"
            :aria-label="`Lihat ${row.original.name}`"
            @click="openDetails(row.original)"
          >
            <PhEye class="size-4" />
          </Button>
          <Button
            size="icon"
            class="size-8"
            :aria-label="`Edit ${row.original.name}`"
            @click="editingStudio = row.original"
          >
            <PhPencilSimple class="size-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            class="size-8"
            :disabled="deleteStudio.isPending.value"
            :aria-label="`Hapus ${row.original.name}`"
            @click="handleDelete(row.original)"
          >
            <PhTrash class="size-4" />
          </Button>
        </div>
      </template>
    </DataTable>

    <div v-if="studiosQuery.isError.value" class="flex justify-center">
      <Button variant="outline" @click="studiosQuery.refetch()">
        Coba muat ulang
      </Button>
    </div>

    <CreateStudioModal
      v-model:open="createOpen"
      :loading="
        createStudio.isPending.value || uploadStudioGallery.isPending.value
      "
      @submit="handleCreate"
    />
    <EditStudioModal
      v-model:open="editOpen"
      :studio="editingStudio"
      :existing-gallery-images="galleryImages"
      :gallery-loading="galleryQuery.isPending.value"
      :gallery-error="galleryQuery.isError.value"
      :deleting-gallery-image-id="deletingGalleryImageId"
      :loading="
        updateStudio.isPending.value ||
        uploadStudioGallery.isPending.value ||
        deleteStudioImage.isPending.value
      "
      @submit="handleUpdate"
      @delete-gallery-image="handleDeleteGalleryImage"
      @refresh-gallery="galleryQuery.refetch()"
    />
    <StudioDetailSheet
      v-model:open="detailOpen"
      :studio="selectedStudio"
      :gallery-images="galleryImages"
      :gallery-loading="galleryQuery.isPending.value"
      :gallery-error="galleryQuery.isError.value"
      @refresh-gallery="galleryQuery.refetch()"
      @edit="(studio) => (editingStudio = studio)"
    />
  </section>
</template>
