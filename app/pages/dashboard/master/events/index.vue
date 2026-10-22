<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import type { DateRange } from "reka-ui";
import { today } from "@internationalized/date";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  PhArrowDown,
  PhArrowUp,
  PhDotsSixVertical,
  PhEye,
  PhPencilSimple,
  PhPlus,
  PhTrash,
} from "@phosphor-icons/vue";
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
import { Button, buttonVariants } from "@/components/ui/button";
import EventDetailSheet from "./components/EventDetailSheet.vue";
import EventFormDialog from "./components/EventFormDialog.vue";
import EventSessionFormDialog from "./components/EventSessionFormDialog.vue";
import { ApiError } from "~/utils/api-error";
import { withToastPromise } from "~/utils/toast-promise";
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
  closed: "Ditutup",
  archived: "Diarsipkan",
};

const STATUS_CLASS: Record<EventStatus, string> = {
  draft: "border-transparent bg-muted text-muted-foreground",
  published: "border-transparent bg-primary/10 text-primary",
  closed: "border-transparent bg-destructive/10 text-destructive",
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
    id: "reorder",
    header: "",
    size: 64,
    minSize: 64,
    maxSize: 64,
    enableSorting: false,
  }),
  columnHelper.display({
    id: "no",
    header: "No",
    size: 64,
    minSize: 64,
    maxSize: 64,
    enableSorting: false,
  }),
  columnHelper.accessor("name", {
    header: "Event",
    size: 260,
    minSize: 200,
    enableSorting: false,
  }),
  columnHelper.accessor("short_description", {
    header: "Ringkasan",
    size: 260,
    minSize: 180,
    enableSorting: false,
  }),
  columnHelper.accessor("sessions_count", {
    header: "Sesi",
    size: 90,
    minSize: 76,
    enableSorting: false,
  }),
  columnHelper.accessor("open_sessions_count", {
    header: "Dijual",
    size: 90,
    minSize: 76,
    enableSorting: false,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    size: 130,
    minSize: 110,
    enableSorting: false,
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
});
const reorderEvent = useApiPost<
  ApiEnvelope<EventModel>,
  { id: number; target_id: number; position: "before" | "after" }
>({
  url: "/master/event/order",
  invalidateKeys: [["events"]],
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
});
const toggleEventAvailability = useApiPost<ApiEnvelope<EventModel>, number>({
  url: (id) => `/master/event/${id}/toggle-availability`,
  invalidateKeys: [
    ["events"],
    ["event-sessions"],
    ["booking-event-options"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
  options: { meta: { silentError: true } },
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
    archiveEvent.isPending.value ||
    toggleEventAvailability.isPending.value,
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

const formatError = (error: unknown) => {
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
  return `${apiError.message}${validationDetails ? ` ${validationDetails}` : ""}`;
};

const refreshEventData = async (eventId: number) => {
  const [eventsResult, allSessionsResult, filteredSessionsResult] =
    await Promise.all([
      eventsQuery.refetch(),
      sessionsQuery.refetch(),
      filteredSessionsQuery.refetch(),
    ]);

  const failedResult = [
    eventsResult,
    allSessionsResult,
    filteredSessionsResult,
  ].find((result) => result.isError);
  if (failedResult?.isError) {
    toast.error("Sesi tersimpan, tetapi data belum diperbarui", {
      description: ApiError.from(failedResult.error).userMessage,
      duration: 6000,
    });
    return;
  }

  if (selectedEvent.value?.id !== eventId) return;

  const refreshedEvent = eventsQuery.data.value?.data.find(
    (event) => event.id === eventId,
  );
  if (refreshedEvent) selectedEvent.value = refreshedEvent;
};

const handleCreateEvent = async (values: EventFormValues) => {
  let createdEvent: EventModel | null = null;
  let stage = "membuat event";
  await withToastPromise(
    async () => {
      const response = await createEvent.mutateAsync(toEventFormData(values));
      createdEvent = response.data;
      selectedEvent.value = response.data;
      createOpen.value = false;

      if (values.first_session === null) {
        return {
          title: "Event berhasil dibuat sebagai draft",
          description: `${response.data.name} · ${response.data.code}`,
        };
      }

      stage = "membuat sesi";
      await createSession.mutateAsync({
        eventId: response.data.id,
        values: sessionPayload(values.first_session),
      });

      stage = "menerbitkan event";
      const publishedResponse = await publishEvent.mutateAsync(
        response.data.id,
      );
      selectedEvent.value = publishedResponse.data;
      detailOpen.value = true;
      return {
        title: "Event berhasil diterbitkan",
        description: `${publishedResponse.data.name} · Penjualan sesi aktif selama periode pendaftaran dan slot tersedia.`,
      };
    },
    {
      loading: "Menyimpan event...",
      success: (message) => message,
      error: (error) => ({
        title: createdEvent
          ? `Event dibuat, tetapi gagal ${stage}`
          : "Event gagal dibuat",
        description: createdEvent
          ? `${formatError(error)} Lanjutkan dari detail event.`
          : formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleUpdateEvent = async (values: EventFormValues) => {
  const event = editingEvent.value;
  if (!event) return;

  await withToastPromise(
    async () => {
      const response = await updateEvent.mutateAsync({
        id: event.id,
        formData: toEventFormData(values, true),
      });
      if (selectedEvent.value?.id === event.id) {
        selectedEvent.value = response.data;
      }
      editingEvent.value = null;
      return {
        title: "Event berhasil diperbarui",
        description: `${response.data.name} · ${response.data.code}`,
      };
    },
    {
      loading: "Memperbarui event...",
      success: (message) => message,
      error: (error) => ({
        title: "Event gagal diperbarui",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleDeleteEvent = async (event: EventModel) => {
  if (
    !window.confirm(
      `Hapus event "${event.name}"? Hanya event dengan sesi draft/dibatalkan dan tanpa booking yang dapat dihapus.`,
    )
  ) {
    return;
  }

  await withToastPromise(
    async () => {
      await deleteEvent.mutateAsync(event.id);
      if (selectedEvent.value?.id === event.id) {
        selectedEvent.value = null;
        detailOpen.value = false;
      }
      return {
        title: "Event berhasil dihapus",
        description: `${event.name} · ${event.code}`,
      };
    },
    {
      loading: "Menghapus event...",
      success: (message) => message,
      error: (error) => ({
        title: "Event gagal dihapus",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleEventReorder = async (payload: {
  sourceId: string;
  targetId: string;
  sourceIndex: number;
  targetIndex: number;
}) => {
  const id = Number(payload.sourceId);
  const targetId = Number(payload.targetId);
  if (
    !Number.isSafeInteger(id) ||
    !Number.isSafeInteger(targetId) ||
    id === targetId ||
    reorderEvent.isPending.value
  ) {
    return;
  }

  await withToastPromise(
    async () => {
      const response = await reorderEvent.mutateAsync({
        id,
        target_id: targetId,
        position:
          payload.sourceIndex < payload.targetIndex ? "after" : "before",
      });
      return {
        title: "Urutan event berhasil diperbarui",
        description: `${response.data.name} akan tampil sesuai posisi barunya di website.`,
      };
    },
    {
      loading: "Memperbarui urutan event...",
      success: (message) => message,
      error: (error) => ({
        title: "Urutan event gagal diperbarui",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handlePublish = async (event: EventModel) => {
  await withToastPromise(
    async () => {
      const response = await publishEvent.mutateAsync(event.id);
      selectedEvent.value = response.data;
      return {
        title: "Event berhasil diterbitkan",
        description: `${response.data.name} · ${response.data.code}`,
      };
    },
    {
      loading: "Menerbitkan event...",
      success: (message) => message,
      error: (error) => ({
        title: "Event belum dapat diterbitkan",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleArchive = async (event: EventModel) => {
  if (!window.confirm(`Arsipkan event "${event.name}" dan tutup penjualan?`)) {
    return;
  }
  await withToastPromise(
    async () => {
      const response = await archiveEvent.mutateAsync(event.id);
      selectedEvent.value = response.data;
      return {
        title: "Event berhasil diarsipkan",
        description: `${response.data.name} · ${response.data.code} · Penjualan ditutup.`,
      };
    },
    {
      loading: "Mengarsipkan event...",
      success: (message) => message,
      error: (error) => ({
        title: "Event gagal diarsipkan",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleToggleEventAvailability = async (event: EventModel) => {
  const closing = event.status === "published";
  if (
    closing &&
    !window.confirm(
      `Tutup event "${event.name}"? Peserta tidak dapat membuat booking baru sampai event dibuka kembali.`,
    )
  ) {
    return;
  }

  await withToastPromise(
    async () => {
      const response = await toggleEventAvailability.mutateAsync(event.id);
      selectedEvent.value = response.data;
      return {
        title: closing ? "Event berhasil ditutup" : "Event berhasil dibuka",
        description: closing
          ? `${event.name} · Peserta tidak dapat membuat booking baru.`
          : `${event.name} · Event dapat menerima booking sesuai ketersediaan sesi.`,
      };
    },
    {
      loading: closing ? "Menutup event..." : "Membuka event...",
      success: (message) => message,
      error: (error) => ({
        title: closing ? "Event gagal ditutup" : "Event gagal dibuka",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleSessionSubmit = async (values: EventSessionFormValues) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (values.studio_id === null) {
    toast.error("Sesi belum dapat disimpan", {
      description: "Pilih studio aktif, lalu coba simpan kembali.",
      duration: 6000,
    });
    return;
  }

  const payload = sessionPayload(values);
  const isEditing = editingSession.value !== null;
  await withToastPromise(
    async () => {
      if (editingSession.value) {
        await updateSession.mutateAsync({
          eventId: event.id,
          sessionId: editingSession.value.id,
          values: payload,
        });
      } else {
        await createSession.mutateAsync({
          eventId: event.id,
          values: payload,
        });
      }
      await refreshEventData(event.id);
      sessionFormOpen.value = false;
      editingSession.value = null;
      return {
        title: isEditing
          ? "Sesi berhasil diperbarui"
          : "Sesi berhasil disiapkan sebagai draft",
        description: `${event.code} · ${activeStudios.value.find((studio) => studio.id === values.studio_id)?.name ?? "Studio"} · ${values.starts_at.replace("T", " ")}`,
      };
    },
    {
      loading: isEditing ? "Memperbarui sesi..." : "Menyimpan sesi...",
      success: (message) => message,
      error: (error) => ({
        title: "Sesi gagal disimpan",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleDeleteSession = async (session: EventSession) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (!window.confirm("Hapus sesi draft ini?")) return;

  await withToastPromise(
    async () => {
      await deleteSession.mutateAsync({
        eventId: event.id,
        sessionId: session.id,
      });
      await refreshEventData(event.id);
      return {
        title: "Sesi berhasil dihapus",
        description: `${event.code} · ${session.studio.name} · ${session.starts_at.replace("T", " ")}`,
      };
    },
    {
      loading: "Menghapus sesi...",
      success: (message) => message,
      error: (error) => ({
        title: "Sesi gagal dihapus",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
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
  await withToastPromise(
    async () => {
      await mutation.mutateAsync({
        eventId: event.id,
        sessionId: session.id,
      });
      await refreshEventData(event.id);
      return {
        close: {
          title: "Penjualan sesi berhasil ditutup",
          description: `${event.code} · ${session.studio.name} · ${session.starts_at.replace("T", " ")}`,
        },
        cancel: {
          title: "Sesi berhasil dibatalkan",
          description: `${event.code} · ${session.studio.name} · ${session.starts_at.replace("T", " ")}`,
        },
      }[action];
    },
    {
      loading:
        action === "close"
          ? "Menutup penjualan sesi..."
          : "Membatalkan sesi...",
      success: (message) => message,
      error: (error) => ({
        title: "Status sesi gagal diperbarui",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleUploadImages = async (images: File[]) => {
  const event = selectedEvent.value;
  if (!event) return;
  const formData = new FormData();
  images.forEach((image) => formData.append("images[]", image));
  await withToastPromise(
    async () => {
      await uploadImages.mutateAsync({ eventId: event.id, formData });
      return {
        title: "Gambar event berhasil diunggah",
        description: `${event.name} · ${images.length} gambar ditambahkan ke galeri.`,
      };
    },
    {
      loading: "Mengunggah gambar event...",
      success: (message) => message,
      error: (error) => ({
        title: "Galeri event gagal diunggah",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
};

const handleDeleteImage = async (image: EventImage) => {
  const event = selectedEvent.value;
  if (!event) return;
  if (!window.confirm("Hapus gambar ini dari galeri event?")) return;
  await withToastPromise(
    async () => {
      await deleteImage.mutateAsync({ eventId: event.id, imageId: image.id });
      return {
        title: "Gambar event berhasil dihapus",
        description: `${event.name} · Gambar #${image.id} dihapus dari galeri.`,
      };
    },
    {
      loading: "Menghapus gambar event...",
      success: (message) => message,
      error: (error) => ({
        title: "Gambar event gagal dihapus",
        description: formatError(error),
        duration: 6000,
      }),
    },
  );
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
          Seret handle pada baris untuk mengatur urutan event di website.
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
      row-reorder
      :get-row-id="(event) => String(event.id)"
      :row-reorder-disabled="
        reorderEvent.isPending.value || eventsQuery.isFetching.value
      "
      manual-pagination
      :page-count="meta?.last_page ?? 0"
      :page-index="pageIndex"
      :total-rows="meta?.total ?? 0"
      @row-click="openDetails"
      @page-change="(nextPage) => (pageIndex = nextPage)"
      @page-size-change="(nextPageSize) => (pageSize = nextPageSize)"
      @row-reorder="handleEventReorder"
    >
      <template
        #cell-reorder="{
          row,
          rowNumber,
          rowIndex,
          handleRef,
          isMobile,
          moveRowUp,
          moveRowDown,
        }"
      >
        <div class="flex items-center justify-center gap-1" @click.stop>
          <button
            :ref="handleRef"
            type="button"
            :class="[
              buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
              'shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing',
            ]"
            :disabled="
              reorderEvent.isPending.value || eventsQuery.isFetching.value
            "
            :aria-label="`Ubah posisi ${row.original.name}, saat ini urutan ${rowNumber}`"
            title="Seret untuk mengubah urutan"
            @click.stop
          >
            <PhDotsSixVertical class="size-4" aria-hidden="true" />
          </button>
          <div v-if="isMobile" class="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="rowIndex === 0 || reorderEvent.isPending.value"
              :aria-label="`Pindahkan ${row.original.name} ke atas`"
              @click.stop="moveRowUp()"
            >
              <PhArrowUp class="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="size-7"
              :disabled="
                rowIndex >= events.length - 1 || reorderEvent.isPending.value
              "
              :aria-label="`Pindahkan ${row.original.name} ke bawah`"
              @click.stop="moveRowDown()"
            >
              <PhArrowDown class="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </template>

      <template #cell-no="{ rowNumber }">
        <span class="tabular-nums">{{ rowNumber }}</span>
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
      @toggle-availability="handleToggleEventAvailability"
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
