<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import type { DateRange } from "reka-ui";
import { today } from "@internationalized/date";
import { createColumnHelper } from "@tanstack/vue-table";
import { PhEye, PhPencilSimple, PhPlus, PhTrash } from "@phosphor-icons/vue";
import { toast } from "vue-sonner";
import DataTable from "~/components/DataTable.vue";
import type { DataTableFeatures } from "~/components/dataTableFeatures";
import {
  useApiDelete,
  useApiPost,
  useApiPut,
} from "~/composables/useApiMutation";
import { useApiQuery } from "~/composables/useApiQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EventDetailSheet from "./components/EventDetailSheet.vue";
import EventFormDialog from "./components/EventFormDialog.vue";
import EventSessionFormDialog from "./components/EventSessionFormDialog.vue";
import { ApiError } from "~/utils/api-error";
import { toJakartaDateTime } from "~/utils/jakarta-date-time";
import type {
  ApiEnvelope,
  Event as EventModel,
  EventFormValues,
  EventImage,
  EventSession,
  EventSessionFormValues,
  EventStatus,
  Studio,
} from "./types/event.types";
import EventFilter from "./components/EventFilter.vue";

definePageMeta({ layout: "dashboard" });
useHead({ title: "Event" });

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Terbit",
  archived: "Diarsipkan",
};

const STATUS_CLASS: Record<EventStatus, string> = {
  draft: "border-transparent bg-muted text-muted-foreground",
  published: "border-transparent bg-primary/10 text-primary",
  archived: "border-transparent bg-accent text-accent-foreground",
};

const searchInput = ref("");
const search = ref("");
const status = ref<"all" | EventStatus>("all");
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
watch([search, status], () => {
  pageIndex.value = 0;
});

const queryParams = computed(() => ({
  page: pageIndex.value + 1,
  per_page: pageSize.value,
  ...(search.value ? { search: search.value } : {}),
  ...(status.value !== "all" ? { status: status.value } : {}),
}));

const eventsQuery = useApiQuery<ApiEnvelope<EventModel[]>>({
  queryKey: computed(() => ["events", queryParams.value]),
  url: "/master/event",
  params: queryParams,
  options: { enabled: import.meta.client },
});
const events = computed(() => eventsQuery.data.value?.data ?? []);
const meta = computed(() => eventsQuery.data.value?.meta);

const activeStudiosQuery = useApiQuery<ApiEnvelope<Studio[]>>({
  queryKey: ["event-form-active-studios"],
  url: "/master/studio",
  params: { status: "active", per_page: 100 },
  options: { enabled: import.meta.client, staleTime: 60_000 },
});
const activeStudios = computed(() => activeStudiosQuery.data.value?.data ?? []);

const columnHelper = createColumnHelper<DataTableFeatures, EventModel>();
const columns = columnHelper.columns([
  columnHelper.display({
    id: "no",
    header: "No",
    size: 64,
    minSize: 48,
    maxSize: 72,
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    header: "Event",
    size: 260,
    minSize: 200,
  }),
  columnHelper.accessor("short_description", {
    header: "Ringkasan",
    size: 260,
    minSize: 180,
  }),
  columnHelper.accessor("sessions_count", {
    header: "Sesi",
    size: 90,
    minSize: 76,
  }),
  columnHelper.accessor("open_sessions_count", {
    header: "Dijual",
    size: 90,
    minSize: 76,
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
const selectedEvent = ref<EventModel | null>(null);
const editingEvent = ref<EventModel | null>(null);
const editEventOpen = computed({
  get: () => editingEvent.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editingEvent.value = null;
  },
});

const eventId = computed(() => selectedEvent.value?.id ?? null);
const defaultSessionDateRange = (): DateRange => {
  const start = today("Asia/Jakarta");

  return {
    start,
    end: start.add({ days: 6 }),
  };
};
const sessionDateRange = ref<DateRange>(defaultSessionDateRange());
watch(eventId, () => {
  sessionDateRange.value = defaultSessionDateRange();
});
const sessionDateParams = computed(() => {
  const { start, end } = sessionDateRange.value;
  return start && end
    ? { start_date: start.toString(), end_date: end.toString() }
    : {};
});
const hasSessionDateRange = computed(
  () =>
    sessionDateRange.value.start !== undefined &&
    sessionDateRange.value.end !== undefined,
);
const sessionQueryParams = computed(() => ({
  per_page: 100,
  ...sessionDateParams.value,
}));
const sessionsQuery = useApiQuery<ApiEnvelope<EventSession[]>>({
  queryKey: computed(() => ["event-sessions", eventId.value]),
  url: computed(() =>
    eventId.value === null
      ? "/master/event/0/session"
      : `/master/event/${eventId.value}/session`,
  ),
  params: { per_page: 100 },
  options: {
    enabled: computed(
      () => import.meta.client && detailOpen.value && eventId.value !== null,
    ),
  },
});
const filteredSessionsQuery = useApiQuery<ApiEnvelope<EventSession[]>>({
  queryKey: computed(() => [
    "event-sessions",
    eventId.value,
    sessionQueryParams.value,
  ]),
  url: computed(() =>
    eventId.value === null
      ? "/master/event/0/session"
      : `/master/event/${eventId.value}/session`,
  ),
  params: sessionQueryParams,
  options: {
    enabled: computed(
      () =>
        import.meta.client &&
        detailOpen.value &&
        eventId.value !== null &&
        hasSessionDateRange.value,
    ),
  },
});
const sessions = computed(() =>
  hasSessionDateRange.value
    ? (filteredSessionsQuery.data.value?.data ?? [])
    : (sessionsQuery.data.value?.data ?? []),
);
const publishableSessions = computed(
  () => sessionsQuery.data.value?.data ?? [],
);
const sessionListLoading = computed(() =>
  hasSessionDateRange.value
    ? filteredSessionsQuery.isPending.value
    : sessionsQuery.isPending.value,
);
const sessionListError = computed(() =>
  hasSessionDateRange.value
    ? filteredSessionsQuery.isError.value
    : sessionsQuery.isError.value,
);

const imagesQuery = useApiQuery<ApiEnvelope<EventImage[]>>({
  queryKey: computed(() => ["event-images", eventId.value]),
  url: computed(() =>
    eventId.value === null
      ? "/master/event/0/image"
      : `/master/event/${eventId.value}/image`,
  ),
  params: { per_page: 100 },
  options: {
    enabled: computed(() => import.meta.client && eventId.value !== null),
  },
});
const images = computed(() => imagesQuery.data.value?.data ?? []);

const createEvent = useApiPost<ApiEnvelope<EventModel>, FormData>({
  url: "/master/event",
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});
const updateEvent = useApiPost<
  ApiEnvelope<EventModel>,
  { id: number; formData: FormData }
>({
  url: ({ id }) => `/master/event/${id}`,
  body: ({ formData }) => formData,
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});
const deleteEvent = useApiDelete<ApiEnvelope<null>, number>({
  url: (id) => `/master/event/${id}`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["event-images"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});
const publishEvent = useApiPost<ApiEnvelope<EventModel>, number>({
  url: (id) => `/master/event/${id}/publish`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});
const archiveEvent = useApiPost<ApiEnvelope<EventModel>, number>({
  url: (id) => `/master/event/${id}/archive`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});

const createSession = useApiPost<
  ApiEnvelope<EventSession>,
  { eventId: number; values: Record<string, unknown> }
>({
  url: ({ eventId }) => `/master/event/${eventId}/session`,
  body: ({ values }) => values,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
});
const updateSession = useApiPut<
  ApiEnvelope<EventSession>,
  { eventId: number; sessionId: number; values: Record<string, unknown> }
>({
  url: ({ eventId, sessionId }) =>
    `/master/event/${eventId}/session/${sessionId}`,
  body: ({ values }) => values,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
});
const deleteSession = useApiDelete<
  ApiEnvelope<null>,
  { eventId: number; sessionId: number }
>({
  url: ({ eventId, sessionId }) =>
    `/master/event/${eventId}/session/${sessionId}`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});

const closeSession = useApiPost<
  ApiEnvelope<EventSession>,
  { eventId: number; sessionId: number }
>({
  url: ({ eventId, sessionId }) =>
    `/master/event/${eventId}/session/${sessionId}/close`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});
const cancelSession = useApiPost<
  ApiEnvelope<EventSession>,
  { eventId: number; sessionId: number }
>({
  url: ({ eventId, sessionId }) =>
    `/master/event/${eventId}/session/${sessionId}/cancel`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
});

const uploadImages = useApiPost<
  ApiEnvelope<EventImage[]>,
  { eventId: number; formData: FormData }
>({
  url: ({ eventId }) => `/master/event/${eventId}/image/bulk`,
  body: ({ formData }) => formData,
  config: { headers: { "Content-Type": "multipart/form-data" } },
  invalidateKeys: [["event-images"]],
  options: { meta: { silentError: true } },
});
const deleteImage = useApiDelete<
  ApiEnvelope<null>,
  { eventId: number; imageId: number }
>({
  url: ({ eventId, imageId }) => `/master/event/${eventId}/image/${imageId}`,
  invalidateKeys: [["event-images"]],
});

const sessionFormOpen = ref(false);
const editingSession = ref<EventSession | null>(null);
const sessionDialogOpen = computed({
  get: () => sessionFormOpen.value,
  set: (isOpen: boolean) => {
    sessionFormOpen.value = isOpen;
    if (!isOpen) editingSession.value = null;
  },
});
const sessionMutationLoading = computed(
  () =>
    createSession.isPending.value ||
    updateSession.isPending.value ||
    deleteSession.isPending.value ||
    closeSession.isPending.value ||
    cancelSession.isPending.value,
);
const eventMutationLoading = computed(
  () =>
    createEvent.isPending.value ||
    updateEvent.isPending.value ||
    deleteEvent.isPending.value ||
    publishEvent.isPending.value ||
    archiveEvent.isPending.value,
);
const createEventWorkflowLoading = computed(
  () =>
    createEvent.isPending.value ||
    createSession.isPending.value ||
    publishEvent.isPending.value,
);

const toEventFormData = (values: EventFormValues, update = false) => {
  const formData = new FormData();
  if (update) formData.append("_method", "PUT");
  formData.append("name", values.name);
  formData.append("category", values.category);
  formData.append("short_description", values.short_description);
  formData.append("description", values.description);
  formData.append("terms", values.terms);
  if (values.cover_image) formData.append("cover_image", values.cover_image);
  return formData;
};

const sessionPayload = (values: EventSessionFormValues) => ({
  studio_id: values.studio_id,
  starts_at: toJakartaDateTime(values.starts_at),
  ends_at: toJakartaDateTime(values.ends_at),
  registration_opens_at: toJakartaDateTime(values.registration_opens_at),
  registration_closes_at: toJakartaDateTime(values.registration_closes_at),
  quota: values.quota,
  price: values.price,
  notes: values.notes || null,
});

const reportError = (verb: string, error: unknown) => {
  const apiError = ApiError.from(error);
  const validationDetails = Object.entries(apiError.errors ?? {})
    .flatMap(([field, messages]) =>
      messages.map((message) => {
        if (
          field === "registration_closes_at" &&
          message.includes("before or equal to starts at")
        ) {
          return "Pendaftaran harus ditutup sebelum atau saat sesi dimulai.";
        }
        if (
          field === "registration_opens_at" &&
          message.includes("before or equal to starts at")
        ) {
          return "Pendaftaran harus dibuka sebelum atau saat sesi dimulai.";
        }
        if (
          field === "registration_closes_at" &&
          message.includes("after registration_opens_at")
        ) {
          return "Waktu tutup pendaftaran harus setelah waktu buka.";
        }
        return message;
      }),
    )
    .join(" ");
  toast.error(
    `${verb}. ${apiError.message}${validationDetails ? ` ${validationDetails}` : ""}`,
  );
};

const handleCreateEvent = async (values: EventFormValues) => {
  let createdEvent: EventModel;
  try {
    const response = await createEvent.mutateAsync(toEventFormData(values));
    createdEvent = response.data;
  } catch (error) {
    reportError("Event gagal dibuat", error);
    return;
  }

  selectedEvent.value = createdEvent;
  createOpen.value = false;

  if (values.first_session === null) {
    toast.success("Event berhasil dibuat sebagai draft.");
    return;
  }

  let stage = "membuat sesi";
  try {
    await createSession.mutateAsync({
      eventId: createdEvent.id,
      values: sessionPayload(values.first_session),
    });

    stage = "menerbitkan event";
    const publishedResponse = await publishEvent.mutateAsync(createdEvent.id);
    selectedEvent.value = publishedResponse.data;

    selectedEvent.value = publishedResponse.data;
    detailOpen.value = true;
    toast.success(
      "Event diterbitkan. Penjualan sesi aktif otomatis selama periode pendaftaran dan slot tersedia.",
    );
  } catch (error) {
    detailOpen.value = true;
    reportError(
      `Event berhasil dibuat, tetapi gagal ${stage}. Lanjutkan dari detail event`,
      error,
    );
  }
};

const handleUpdateEvent = async (values: EventFormValues) => {
  const event = editingEvent.value;
  if (!event) return;

  try {
    const response = await updateEvent.mutateAsync({
      id: event.id,
      formData: toEventFormData(values, true),
    });
    if (selectedEvent.value?.id === event.id) {
      selectedEvent.value = response.data;
    }
    editingEvent.value = null;
    toast.success("Event berhasil diperbarui.");
  } catch (error) {
    reportError("Event gagal diperbarui", error);
  }
};

const handleDeleteEvent = async (event: EventModel) => {
  if (
    !window.confirm(
      `Hapus event "${event.name}"? Hanya event dengan sesi draft/dibatalkan dan tanpa booking yang dapat dihapus.`,
    )
  ) {
    return;
  }

  try {
    await deleteEvent.mutateAsync(event.id);
    if (selectedEvent.value?.id === event.id) {
      selectedEvent.value = null;
      detailOpen.value = false;
    }
    toast.success("Event berhasil dihapus.");
  } catch (error) {
    reportError("Event gagal dihapus", error);
  }
};

const handlePublish = async (event: EventModel) => {
  try {
    const response = await publishEvent.mutateAsync(event.id);
    selectedEvent.value = response.data;
    toast.success("Event berhasil diterbitkan.");
  } catch (error) {
    reportError("Event belum dapat diterbitkan", error);
  }
};

const handleArchive = async (event: EventModel) => {
  if (!window.confirm(`Arsipkan event "${event.name}" dan tutup penjualan?`)) {
    return;
  }
  try {
    const response = await archiveEvent.mutateAsync(event.id);
    selectedEvent.value = response.data;
    toast.success("Event berhasil diarsipkan.");
  } catch (error) {
    reportError("Event gagal diarsipkan", error);
  }
};

const handleSessionSubmit = async (values: EventSessionFormValues) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (values.studio_id === null) {
    toast.error("Pilih studio aktif sebelum menyimpan sesi.");
    return;
  }

  const payload = sessionPayload(values);
  try {
    if (editingSession.value) {
      await updateSession.mutateAsync({
        eventId: event.id,
        sessionId: editingSession.value.id,
        values: payload,
      });
      toast.success("Sesi berhasil diperbarui.");
    } else {
      await createSession.mutateAsync({
        eventId: event.id,
        values: payload,
      });
      toast.success("Sesi berhasil disiapkan sebagai draft.");
    }
    sessionFormOpen.value = false;
    editingSession.value = null;
  } catch (error) {
    reportError("Sesi gagal disimpan", error);
  }
};

const handleDeleteSession = async (session: EventSession) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (!window.confirm("Hapus sesi draft ini?")) return;

  try {
    await deleteSession.mutateAsync({
      eventId: event.id,
      sessionId: session.id,
    });
    toast.success("Sesi berhasil dihapus.");
  } catch (error) {
    reportError("Sesi gagal dihapus", error);
  }
};

const handleSessionTransition = async (
  action: "close" | "cancel",
  session: EventSession,
) => {
  const event = selectedEvent.value;
  if (!event) return;
  const mutation = {
    close: closeSession,
    cancel: cancelSession,
  }[action];
  try {
    await mutation.mutateAsync({
      eventId: event.id,
      sessionId: session.id,
    });
    const message = {
      close: "Penjualan sesi berhasil ditutup.",
      cancel: "Sesi berhasil dibatalkan.",
    }[action];
    toast.success(message);
  } catch (error) {
    reportError("Status sesi gagal diperbarui", error);
  }
};

const handleUploadImages = async (images: File[]) => {
  const event = selectedEvent.value;
  if (!event) return;
  const formData = new FormData();
  images.forEach((image) => formData.append("images[]", image));
  try {
    await uploadImages.mutateAsync({ eventId: event.id, formData });
    toast.success(`${images.length} gambar event berhasil diunggah.`);
  } catch (error) {
    reportError("Galeri event gagal diunggah", error);
  }
};

const handleDeleteImage = async (image: EventImage) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (!window.confirm("Hapus gambar ini dari galeri event?")) return;
  try {
    await deleteImage.mutateAsync({ eventId: event.id, imageId: image.id });
    toast.success("Gambar event berhasil dihapus.");
  } catch (error) {
    reportError("Gambar event gagal dihapus", error);
  }
};

const openDetails = (event: EventModel) => {
  selectedEvent.value = event;
  detailOpen.value = true;
};

const startEditEvent = (event: EventModel) => {
  detailOpen.value = false;
  editingEvent.value = event;
};

const startCreateSession = () => {
  editingSession.value = null;
  sessionFormOpen.value = true;
};

const startEditSession = (session: EventSession) => {
  editingSession.value = session;
  sessionFormOpen.value = true;
};
</script>

<template>
  <section
    class="flex min-h-full w-full flex-col gap-5 bg-background px-4 py-6 text-foreground md:px-8 md:py-8"
  >
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Event</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Siapkan konten event dan sesi, lalu buka slot yang siap dijual.
        </p>
      </div>
      <Button class="h-10 gap-2 rounded-xl px-4" @click="createOpen = true">
        <PhPlus class="size-4" weight="bold" />
        Tambah event
      </Button>
    </header>

    <EventFilter v-model:search-input="searchInput" v-model:status="status" />

    <DataTable
      :columns="columns"
      :data="events"
      :default-page-size="pageSize"
      :is-loading="eventsQuery.isPending.value"
      :empty-message="
        eventsQuery.isError.value
          ? 'Data event gagal dimuat. Periksa koneksi lalu coba lagi.'
          : 'Event tidak ditemukan.'
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
            <p class="truncate font-medium">{{ row.original.name }}</p>
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

      <template #cell-sessions_count="{ row }">
        {{ row.original.sessions_count ?? 0 }}
      </template>

      <template #cell-open_sessions_count="{ row }">
        {{ row.original.open_sessions_count ?? 0 }}
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
            @click="editingEvent = row.original"
          >
            <PhPencilSimple class="size-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            class="size-8"
            :disabled="deleteEvent.isPending.value"
            :aria-label="`Hapus ${row.original.name}`"
            @click="handleDeleteEvent(row.original)"
          >
            <PhTrash class="size-4" />
          </Button>
        </div>
      </template>
    </DataTable>

    <div v-if="eventsQuery.isError.value" class="flex justify-center">
      <Button variant="outline" @click="eventsQuery.refetch()">
        Coba muat ulang
      </Button>
    </div>

    <EventFormDialog
      v-model:open="createOpen"
      :event="null"
      :loading="createEventWorkflowLoading"
      :studios="activeStudios"
      :studios-loading="activeStudiosQuery.isPending.value"
      :studios-error="activeStudiosQuery.isError.value"
      @submit="handleCreateEvent"
      @refresh-studios="activeStudiosQuery.refetch()"
    />
    <EventFormDialog
      v-model:open="editEventOpen"
      :event="editingEvent"
      :loading="updateEvent.isPending.value"
      :studios="activeStudios"
      :studios-loading="activeStudiosQuery.isPending.value"
      :studios-error="activeStudiosQuery.isError.value"
      @submit="handleUpdateEvent"
      @refresh-studios="activeStudiosQuery.refetch()"
    />

    <EventDetailSheet
      v-model:open="detailOpen"
      :event="selectedEvent"
      :sessions="sessions"
      :publishable-sessions="publishableSessions"
      :session-date-range="sessionDateRange"
      :sessions-loading="sessionListLoading"
      :sessions-error="sessionListError"
      :images="images"
      :images-loading="
        imagesQuery.isPending.value || uploadImages.isPending.value
      "
      :images-error="imagesQuery.isError.value"
      :studios="activeStudios"
      :studios-error="activeStudiosQuery.isError.value"
      :loading="
        eventMutationLoading ||
        sessionMutationLoading ||
        uploadImages.isPending.value ||
        deleteImage.isPending.value
      "
      @edit-event="startEditEvent"
      @create-session="startCreateSession"
      @edit-session="startEditSession"
      @publish="handlePublish"
      @archive="handleArchive"
      @close-session="handleSessionTransition('close', $event)"
      @cancel-session="handleSessionTransition('cancel', $event)"
      @delete-session="handleDeleteSession"
      @upload-images="handleUploadImages"
      @delete-image="handleDeleteImage"
      @refresh-sessions="
        hasSessionDateRange
          ? filteredSessionsQuery.refetch()
          : sessionsQuery.refetch()
      "
      @update-session-date-range="sessionDateRange = $event"
      @refresh-images="imagesQuery.refetch()"
      @refresh-studios="activeStudiosQuery.refetch()"
    />
    <EventSessionFormDialog
      v-model:open="sessionDialogOpen"
      :session="editingSession"
      :studios="activeStudios"
      :studios-loading="activeStudiosQuery.isPending.value"
      :studios-error="activeStudiosQuery.isError.value"
      :loading="createSession.isPending.value || updateSession.isPending.value"
      @submit="handleSessionSubmit"
      @refresh-studios="activeStudiosQuery.refetch()"
    />
  </section>
</template>
