<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  PhArrowSquareOut,
  PhEye,
  PhPencilSimple,
  PhPlus,
  PhTrash,
} from "@phosphor-icons/vue";
import DataTable from "~/components/DataTable.vue";
import type { DataTableFeatures } from "~/components/dataTableFeatures";
import { useApiDelete, useApiPut } from "~/composables/useApiMutation";
import { useApiQuery } from "~/composables/useApiQuery";
import { ApiError } from "~/utils/api-error";
import { withToastPromise } from "~/utils/toast-promise";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BookingDetailSheet from "./components/BookingDetailSheet.vue";
import EditBookingModal from "./components/EditBookingModal.vue";
import EventBookingDialog from "./components/EventBookingDialog.vue";
import type {
  ApiEnvelope,
  BookingUpdateInput,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  EventBooking,
} from "./types/booking.types";
import BookingFilter from "./components/BookingFilter.vue";
import CopyableText from "~/components/CopyableText.vue";

definePageMeta({ layout: "dashboard" });
useHead({ title: "Booking Event" });

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Menunggu pembayaran",
  confirmed: "Terkonfirmasi",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
  payment_review: "Perlu pemeriksaan",
};
const PAYMENT_STATUS_LABEL: Record<BookingPaymentStatus, string> = {
  pending: "Belum dibayar",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};

const bookingOpen = ref(false);
const paymentMethod = ref<BookingPaymentMethod>("midtrans");
const detailOpen = ref(false);
const selectedBooking = ref<EventBooking | null>(null);
const editingBooking = ref<EventBooking | null>(null);
const editOpen = computed({
  get: () => editingBooking.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) editingBooking.value = null;
  },
});
const search = ref("");
const searchInput = ref("");
const bookingStatus = ref<"" | BookingStatus>("");
const paymentStatus = ref<"" | BookingPaymentStatus>("");
const pageIndex = ref(0);
const pageSize = ref(10);

watch(searchInput, (value) => {
  search.value = value.trim();
  pageIndex.value = 0;
});
watch([bookingStatus, paymentStatus], () => {
  pageIndex.value = 0;
});

const filters = computed(() => ({
  page: pageIndex.value + 1,
  per_page: pageSize.value,
  ...(search.value ? { search: search.value } : {}),
  ...(bookingStatus.value ? { booking_status: bookingStatus.value } : {}),
  ...(paymentStatus.value ? { payment_status: paymentStatus.value } : {}),
}));
const bookingsQuery = useApiQuery<ApiEnvelope<EventBooking[]>>({
  queryKey: computed(() => ["event-bookings", filters.value]),
  url: "/master/event-booking",
  method: "GET",
  params: filters,
  options: { enabled: import.meta.client },
});
const bookings = computed(() => bookingsQuery.data.value?.data ?? []);
const meta = computed(() => bookingsQuery.data.value?.meta);
const detailBookingId = computed(() => selectedBooking.value?.id ?? null);
const bookingDetailQuery = useApiQuery<ApiEnvelope<EventBooking>>({
  queryKey: computed(() => ["event-booking", detailBookingId.value]),
  url: computed(() => `/master/event-booking/${detailBookingId.value ?? 0}`),
  options: {
    enabled: computed(
      () =>
        import.meta.client &&
        detailOpen.value &&
        detailBookingId.value !== null,
    ),
  },
});
const detailBooking = computed(
  () =>
    (bookingDetailQuery.isFetching.value
      ? selectedBooking.value
      : bookingDetailQuery.data.value?.data) ?? selectedBooking.value,
);

const columnHelper = createColumnHelper<DataTableFeatures, EventBooking>();
const columns = columnHelper.columns([
  columnHelper.accessor("booking_code", {
    header: "Kode booking",
    size: 170,
    minSize: 150,
    cell: (info) => h(CopyableText, { text: info.getValue() }),
  }),
  columnHelper.accessor("customer_name", {
    header: "Customer",
    size: 200,
    minSize: 160,
    cell: (info) => h(CopyableText, { text: info.getValue() }),
  }),
  columnHelper.accessor("event_name_snapshot", {
    header: "Event dan sesi",
    size: 250,
    minSize: 200,
  }),
  columnHelper.accessor("quantity", {
    header: "Slot",
    size: 80,
    minSize: 70,
  }),
  columnHelper.accessor("total_amount", {
    header: "Total",
    size: 150,
    minSize: 130,
  }),
  columnHelper.accessor("payment_method", {
    header: "Metode",
    size: 120,
    minSize: 100,
  }),
  columnHelper.accessor("booking_status", {
    header: "Status booking",
    size: 180,
    minSize: 160,
  }),
  columnHelper.accessor("payment_status", {
    header: "Pembayaran",
    size: 150,
    minSize: 130,
  }),
  columnHelper.accessor("cretime", {
    header: "Dibuat",
    size: 170,
    minSize: 150,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    size: 168,
    minSize: 148,
    enableSorting: false,
  }),
]);

const updateBooking = useApiPut<
  ApiEnvelope<EventBooking>,
  { id: number } & BookingUpdateInput
>({
  url: ({ id }) => `/master/event-booking/${id}`,
  body: ({ id: _id, ...values }) => values,
  invalidateKeys: [
    ["event-bookings"],
    ["event-booking"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
});
const deleteBooking = useApiDelete<
  ApiEnvelope<{ midtrans_cancelled: boolean | null }>,
  number
>({
  url: (id) => `/master/event-booking/${id}`,
  invalidateKeys: [
    ["event-bookings"],
    ["event-booking"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
});

const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
const statusVariant = (status: BookingStatus | BookingPaymentStatus) =>
  status === "confirmed" || status === "paid"
    ? "default"
    : status === "pending_payment" || status === "pending"
      ? "secondary"
      : "outline";
const paymentMethodLabel = (method: BookingPaymentMethod) =>
  method === "cash" ? "Cash" : "Midtrans";

const handleCreated = () => {
  bookingsQuery.refetch();
};

const openDetails = (booking: EventBooking) => {
  selectedBooking.value = booking;
  detailOpen.value = true;
};

const startEdit = (booking: EventBooking) => {
  detailOpen.value = false;
  editingBooking.value = booking;
};

const handleUpdate = async (values: BookingUpdateInput) => {
  const booking = editingBooking.value;
  if (!booking) return;

  await withToastPromise(
    async () => {
      const response = await updateBooking.mutateAsync({
        id: booking.id,
        ...values,
      });
      editingBooking.value = null;
      selectedBooking.value = response.data;
      detailOpen.value = true;
      return {
        title: "Booking berhasil diperbarui",
        description: `${booking.booking_code} · ${
          response.data.event_name_snapshot
        } · ${formatDateTime(response.data.session_starts_at_snapshot)}`,
      };
    },
    {
      loading: "Memperbarui booking...",
      success: (message) => message,
      error: (error) => ({
        title: "Booking gagal diperbarui",
        description: ApiError.from(error).userMessage,
        duration: 6000,
      }),
    },
  );
};

const canDeleteBooking = (booking: EventBooking) =>
  booking.payment_status !== "paid" &&
  !["confirmed", "payment_review"].includes(booking.booking_status);

const handleDelete = async (booking: EventBooking) => {
  if (!canDeleteBooking(booking)) return;
  if (
    !window.confirm(
      `Hapus booking ${booking.booking_code}? Kuota akan dikembalikan. Jika transaksi Midtrans gagal dibatalkan, pembayaran yang terlambat tetap perlu diperiksa manual. Tindakan ini tidak bisa dibatalkan.`,
    )
  ) {
    return;
  }

  await withToastPromise(
    async () => {
      const response = await deleteBooking.mutateAsync(booking.id);
      if (selectedBooking.value?.id === booking.id) {
        selectedBooking.value = null;
        detailOpen.value = false;
      }
      return {
        title: "Booking berhasil dihapus",
        description:
          response.data.midtrans_cancelled === false
            ? `${booking.booking_code} · Kuota dikembalikan. Transaksi Midtrans belum terkonfirmasi dibatalkan; periksa statusnya.`
            : `${booking.booking_code} · Kuota sesi telah dikembalikan.`,
      };
    },
    {
      loading: "Menghapus booking...",
      success: (message) => message,
      error: (error) => ({
        title: "Booking gagal dihapus",
        description: ApiError.from(error).userMessage,
        duration: 6000,
      }),
    },
  );
};
</script>

<template>
  <section
    class="flex min-h-full w-full flex-col gap-5 bg-background px-4 py-6 text-foreground md:px-8 md:py-8"
  >
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Booking Event</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          Lihat booking customer dan catat pemesanan slot event.
        </p>
      </div>
      <div class="flex items-center">
        <Button class="h-10 gap-2 px-4" @click="bookingOpen = true">
          <PhPlus :size="16" weight="bold" />
          Booking
        </Button>
      </div>
    </header>

    <BookingFilter
      v-model:search-input="searchInput"
      v-model:booking-status="bookingStatus"
      v-model:payment-status="paymentStatus"
    />

    <DataTable
      :columns="columns"
      :data="bookings"
      :default-page-size="pageSize"
      :is-loading="bookingsQuery.isPending.value"
      :empty-message="
        bookingsQuery.isError.value
          ? 'Data booking gagal dimuat. Periksa koneksi lalu coba lagi.'
          : 'Belum ada booking yang sesuai.'
      "
      manual-pagination
      :page-count="meta?.last_page ?? 0"
      :page-index="pageIndex"
      :total-rows="meta?.total ?? 0"
      @page-change="(nextPage) => (pageIndex = nextPage)"
      @page-size-change="(nextPageSize) => (pageSize = nextPageSize)"
    >
      <template #cell-customer_name="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium">{{ row.original.customer_name }}</p>
          <p class="truncate text-xs text-muted-foreground">
            {{ row.original.customer_phone }}
          </p>
        </div>
      </template>
      <template #cell-event_name_snapshot="{ row }">
        <div class="min-w-0">
          <p class="truncate font-medium">
            {{ row.original.event_name_snapshot }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{ row.original.session_studio_snapshot }} ·
            {{ formatDateTime(row.original.session_starts_at_snapshot) }}
          </p>
        </div>
      </template>
      <template #cell-total_amount="{ row }">
        {{ formatPrice(row.original.total_amount) }}
      </template>
      <template #cell-payment_method="{ row }">
        {{ paymentMethodLabel(row.original.payment_method) }}
      </template>
      <template #cell-booking_status="{ row }">
        <Badge :variant="statusVariant(row.original.booking_status)">
          {{ BOOKING_STATUS_LABEL[row.original.booking_status] }}
        </Badge>
      </template>
      <template #cell-payment_status="{ row }">
        <Badge :variant="statusVariant(row.original.payment_status)">
          {{ PAYMENT_STATUS_LABEL[row.original.payment_status] }}
        </Badge>
      </template>
      <template #cell-cretime="{ row }">
        {{ formatDateTime(row.original.cretime) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-2" @click.stop>
          <Button
            size="icon"
            variant="outline"
            class="size-8"
            :aria-label="`Lihat detail booking ${row.original.booking_code}`"
            @click="openDetails(row.original)"
          >
            <PhEye class="size-4" />
          </Button>
          <Button
            v-if="
              row.original.booking_status === 'pending_payment' &&
              row.original.payment_status === 'pending' &&
              row.original.payment_method === 'midtrans'
            "
            size="icon"
            class="size-8"
            :aria-label="`Edit booking ${row.original.booking_code}`"
            @click="startEdit(row.original)"
          >
            <PhPencilSimple class="size-4" />
          </Button>
          <Button
            v-if="
              row.original.payment_method === 'midtrans' &&
              row.original.booking_status === 'pending_payment' &&
              row.original.payment_status === 'pending' &&
              row.original.payments?.[0]?.redirect_url
            "
            as-child
            size="icon"
            variant="outline"
            class="size-8"
          >
            <a
              :href="row.original.payments[0].redirect_url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Lanjut bayar booking ${row.original.booking_code}`"
            >
              <PhArrowSquareOut class="size-4" />
            </a>
          </Button>
          <Button
            v-if="canDeleteBooking(row.original)"
            size="icon"
            variant="destructive"
            class="size-8"
            :disabled="deleteBooking.isPending.value"
            :aria-label="`Hapus booking ${row.original.booking_code}`"
            @click="handleDelete(row.original)"
          >
            <PhTrash class="size-4" />
          </Button>
        </div>
      </template>
    </DataTable>

    <div v-if="bookingsQuery.isError.value" class="flex justify-center">
      <Button variant="outline" @click="bookingsQuery.refetch()"
        >Coba muat ulang</Button
      >
    </div>

    <BookingDetailSheet
      v-model:open="detailOpen"
      :booking="detailBooking"
      :loading="bookingDetailQuery.isPending.value"
      :error="bookingDetailQuery.isError.value"
      @edit="startEdit"
      @refresh="bookingDetailQuery.refetch()"
    />

    <EditBookingModal
      v-model:open="editOpen"
      :booking="editingBooking"
      :loading="updateBooking.isPending.value"
      @submit="handleUpdate"
    />

    <EventBookingDialog
      v-model:open="bookingOpen"
      v-model:payment-method="paymentMethod"
      @created="handleCreated"
    />
  </section>
</template>
