<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import {
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
} from "@internationalized/date";
import type { DateRange } from "reka-ui";
import { createColumnHelper } from "@tanstack/vue-table";
import {
  PhArrowClockwise,
  PhArrowSquareOut,
  PhEye,
  PhWarningCircle,
} from "@phosphor-icons/vue";
import DataTable from "~/components/DataTable.vue";
import type { DataTableFeatures } from "~/components/dataTableFeatures";
import { useApiQuery } from "~/composables/useApiQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  EventBooking,
} from "../bookings/types/booking.types";
import BookingDetailSheet from "../bookings/components/BookingDetailSheet.vue";
import PaymentFilter from "./components/PaymentFilter.vue";
import { toast } from "vue-sonner";

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

interface PaymentSummary {
  period: { start_date: string; end_date: string };
  bookings: {
    total: number;
    paid: number;
    paid_rate: number;
    pending: number;
    pending_amount: number;
    failed: number;
    expired: number;
    needs_review: number;
  };
  revenue: {
    total: number;
    transaction_count: number;
    average_transaction: number;
    by_method: {
      method: BookingPaymentMethod;
      transaction_count: number;
      total: number;
    }[];
    daily: { date: string; transaction_count: number; total: number }[];
  };
}

definePageMeta({ layout: "dashboard" });
useHead({ title: "Pembayaran" });

const PAYMENT_STATUS_LABEL: Record<BookingPaymentStatus, string> = {
  pending: "Menunggu",
  paid: "Berhasil",
  failed: "Gagal",
  expired: "Kedaluwarsa",
};
const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Menunggu pembayaran",
  confirmed: "Terkonfirmasi",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
  payment_review: "Perlu pemeriksaan",
};

const currentMonth = today(getLocalTimeZone());
const initialStartDate = startOfMonth(currentMonth);
const initialEndDate = endOfMonth(currentMonth);
const startDate = ref(initialStartDate.toString());
const endDate = ref(initialEndDate.toString());

// State lokal untuk DateRangePicker. Query tetap memakai startDate/endDate
// (string YYYY-MM-DD) dan baru ikut berubah setelah start & end sama-sama
// terisi, sehingga klik pertama pada kalender tidak memicu request.
const dateRange = ref<DateRange>({
  start: initialStartDate,
  end: initialEndDate,
});
watch(dateRange, ({ start, end }) => {
  if (start && end) {
    startDate.value = start.toString();
    endDate.value = end.toString();
  }
});

const searchInput = ref("");
const search = ref("");
const paymentStatus = ref<"" | BookingPaymentStatus>("");
const bookingStatus = ref<"" | BookingStatus>("");
const paymentMethod = ref<"" | BookingPaymentMethod>("");
const pageIndex = ref(0);
const pageSize = ref(10);

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    search.value = value.trim();
  }, 350);
});
onScopeDispose(() => clearTimeout(searchTimer));

watch(
  [startDate, endDate, search, paymentStatus, bookingStatus, paymentMethod],
  () => {
    pageIndex.value = 0;
  },
);

const periodParams = computed(() => ({
  start_date: startDate.value,
  end_date: endDate.value,
}));
const filters = computed(() => ({
  ...periodParams.value,
  page: pageIndex.value + 1,
  per_page: pageSize.value,
  ...(search.value ? { search: search.value } : {}),
  ...(paymentStatus.value ? { payment_status: paymentStatus.value } : {}),
  ...(bookingStatus.value ? { booking_status: bookingStatus.value } : {}),
  ...(paymentMethod.value ? { payment_method: paymentMethod.value } : {}),
}));

const paymentsQuery = useApiQuery<ApiResponse<EventBooking[]>>({
  queryKey: computed(() => ["event-bookings", filters.value]),
  url: "/master/event-booking",
  params: filters,
  options: {
    enabled: computed(
      () => import.meta.client && startDate.value <= endDate.value,
    ),
  },
});
const summaryQuery = useApiQuery<ApiResponse<PaymentSummary>>({
  queryKey: computed(() => ["event-payment-summary", periodParams.value]),
  url: "/master/event-booking/payment-summary",
  params: periodParams,
  options: {
    enabled: computed(
      () => import.meta.client && startDate.value <= endDate.value,
    ),
  },
});
const payments = computed(() => paymentsQuery.data.value?.data ?? []);
const meta = computed(() => paymentsQuery.data.value?.meta);
const summary = computed(() => summaryQuery.data.value?.data);
const paymentMethodSummary = (method: BookingPaymentMethod) =>
  summary.value?.revenue.by_method.find((item) => item.method === method);

const selectedBooking = ref<EventBooking | null>(null);
const detailOpen = ref(false);
const detailBookingId = computed(() => selectedBooking.value?.id ?? null);
const bookingDetailQuery = useApiQuery<ApiResponse<EventBooking>>({
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
    header: "Transaksi / booking",
    size: 210,
    minSize: 180,
  }),
  columnHelper.accessor("customer_name", {
    header: "Customer",
    size: 190,
    minSize: 155,
  }),
  columnHelper.accessor("event_name_snapshot", {
    header: "Event dan sesi",
    size: 230,
    minSize: 190,
  }),
  columnHelper.accessor("total_amount", {
    header: "Nominal",
    size: 150,
    minSize: 130,
  }),
  columnHelper.accessor("payment_method", {
    header: "Metode",
    size: 130,
    minSize: 110,
  }),
  columnHelper.accessor("payment_status", {
    header: "Pembayaran",
    size: 140,
    minSize: 120,
  }),
  columnHelper.accessor("booking_status", {
    header: "Status booking",
    size: 175,
    minSize: 155,
  }),
  columnHelper.accessor("paid_at", {
    header: "Dibayar",
    size: 170,
    minSize: 150,
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    size: 100,
    minSize: 90,
    enableSorting: false,
  }),
]);

const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T12:00:00`));
const paymentMethodLabel = (method: BookingPaymentMethod) =>
  method === "cash" ? "Tunai" : "Midtrans";
const paymentStatusClass = (status: BookingPaymentStatus) =>
  status === "paid"
    ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
    : status === "pending"
      ? "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : "border-transparent bg-destructive/10 text-destructive";
const bookingStatusVariant = (status: BookingStatus) =>
  status === "confirmed"
    ? "default"
    : status === "pending_payment"
      ? "secondary"
      : "outline";
const barHeight = (amount: number) => {
  const maximum = Math.max(
    ...(summary.value?.revenue.daily.map((day) => day.total) ?? [0]),
    1,
  );
  return `${Math.max((amount / maximum) * 100, amount > 0 ? 8 : 0)}%`;
};

const openDetails = (booking: EventBooking) => {
  selectedBooking.value = booking;
  detailOpen.value = true;
};
const refreshAll = async () => {
  await Promise.all([paymentsQuery.refetch(), summaryQuery.refetch()]);
};
</script>

<template>
  <section
    class="flex min-h-full w-full flex-col gap-6 bg-background px-4 py-6 text-foreground md:px-8 md:py-8"
  >
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Pembayaran</h1>
        <p class="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pantau penerimaan, transaksi tertunda, dan pembayaran yang perlu
          ditindaklanjuti.
        </p>
      </div>
      <Button
        variant="outline"
        class="h-10 gap-2"
        :disabled="
          paymentsQuery.isFetching.value || summaryQuery.isFetching.value
        "
        @click="refreshAll"
      >
        <PhArrowClockwise class="size-4" />
        Perbarui data
      </Button>
    </header>

    <section
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Ringkasan pembayaran"
    >
      <article class="rounded-xl border bg-card p-5">
        <p class="text-sm text-muted-foreground">Pendapatan diterima</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">
          {{ formatPrice(summary?.revenue.total ?? 0) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ summary?.revenue.transaction_count ?? 0 }} transaksi lunas pada
          periode
        </p>
      </article>
      <article class="rounded-xl border bg-card p-5">
        <p class="text-sm text-muted-foreground">Konversi booking lunas</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">
          {{ summary?.bookings.paid_rate ?? 0 }}%
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ summary?.bookings.paid ?? 0 }} dari
          {{ summary?.bookings.total ?? 0 }} booking yang dibuat
        </p>
      </article>
      <article class="rounded-xl border bg-card p-5">
        <p class="text-sm text-muted-foreground">Pembayaran tunai</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">
          {{ formatPrice(paymentMethodSummary("cash")?.total ?? 0) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ paymentMethodSummary("cash")?.transaction_count ?? 0 }}
          transaksi berhasil
        </p>
      </article>
      <article class="rounded-xl border bg-card p-5">
        <p class="text-sm text-muted-foreground">Pembayaran online</p>
        <p class="mt-2 text-2xl font-semibold tracking-tight">
          {{ formatPrice(paymentMethodSummary("midtrans")?.total ?? 0) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          {{ paymentMethodSummary("midtrans")?.transaction_count ?? 0 }}
          transaksi berhasil
        </p>
      </article>
    </section>

    <PaymentFilter
      v-model:date-range="dateRange"
      v-model:search-input="searchInput"
      v-model:payment-status="paymentStatus"
      v-model:booking-status="bookingStatus"
      v-model:payment-method="paymentMethod"
    />

    <div
      v-if="paymentsQuery.isError.value"
      class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <PhWarningCircle class="size-4 shrink-0" />
      Data transaksi gagal dimuat.
      <Button
        variant="outline"
        size="sm"
        class="ml-auto"
        @click="paymentsQuery.refetch()"
      >
        Coba lagi
      </Button>
    </div>
    <div
      v-if="summaryQuery.isError.value"
      class="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <PhWarningCircle class="size-4 shrink-0" />
      Ringkasan pembayaran gagal dimuat.
      <Button
        variant="outline"
        size="sm"
        class="ml-auto"
        @click="summaryQuery.refetch()"
      >
        Coba lagi
      </Button>
    </div>

    <DataTable
      :columns="columns"
      :data="payments"
      :default-page-size="pageSize"
      :is-loading="paymentsQuery.isPending.value"
      :empty-message="
        paymentsQuery.isError.value
          ? 'Data transaksi gagal dimuat.'
          : 'Tidak ada transaksi yang sesuai dengan filter.'
      "
      manual-pagination
      :page-count="meta?.last_page ?? 0"
      :page-index="pageIndex"
      :total-rows="meta?.total ?? 0"
      @page-change="(nextPage) => (pageIndex = nextPage)"
      @page-size-change="(nextPageSize) => (pageSize = nextPageSize)"
    >
      <template #cell-booking_code="{ row }">
        <div class="min-w-0">
          <p class="truncate font-mono text-sm font-medium">
            {{ row.original.booking_code }}
          </p>
          <p class="mt-1 truncate text-xs text-muted-foreground">
            {{
              row.original.payments?.[0]?.provider_transaction_id ||
              "ID provider —"
            }}
          </p>
        </div>
      </template>
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
        <span class="whitespace-nowrap font-medium">
          {{ formatPrice(row.original.total_amount) }}
        </span>
      </template>
      <template #cell-payment_method="{ row }">
        <div>
          <p>{{ paymentMethodLabel(row.original.payment_method) }}</p>
          <p
            v-if="row.original.payments?.[0]?.payment_type"
            class="mt-1 text-xs text-muted-foreground"
          >
            {{ row.original.payments[0].payment_type }}
          </p>
        </div>
      </template>
      <template #cell-payment_status="{ row }">
        <div class="grid justify-items-start gap-1">
          <Badge
            variant="outline"
            :class="paymentStatusClass(row.original.payment_status)"
          >
            {{ PAYMENT_STATUS_LABEL[row.original.payment_status] }}
          </Badge>
          <span
            v-if="row.original.payments?.[0]?.provider_status"
            class="text-[11px] text-muted-foreground"
          >
            Provider: {{ row.original.payments[0].provider_status }}
          </span>
        </div>
      </template>
      <template #cell-booking_status="{ row }">
        <Badge :variant="bookingStatusVariant(row.original.booking_status)">
          {{ BOOKING_STATUS_LABEL[row.original.booking_status] }}
        </Badge>
      </template>
      <template #cell-paid_at="{ row }">
        <div>
          <p>{{ formatDateTime(row.original.paid_at) }}</p>
          <p
            v-if="
              row.original.payment_status === 'pending' &&
              row.original.hold_expires_at
            "
            class="mt-1 text-xs text-amber-700 dark:text-amber-300"
          >
            Batas {{ formatDateTime(row.original.hold_expires_at) }}
          </p>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-1" @click.stop>
          <Button
            size="icon"
            variant="outline"
            class="size-8"
            :aria-label="`Lihat detail pembayaran ${row.original.booking_code}`"
            @click="openDetails(row.original)"
          >
            <PhEye class="size-4" />
          </Button>
          <Button
            v-if="
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
              :aria-label="`Buka halaman pembayaran ${row.original.booking_code}`"
            >
              <PhArrowSquareOut class="size-4" />
            </a>
          </Button>
        </div>
      </template>
    </DataTable>

    <BookingDetailSheet
      v-model:open="detailOpen"
      :booking="detailBooking"
      :loading="bookingDetailQuery.isPending.value"
      :error="bookingDetailQuery.isError.value"
      @refresh="bookingDetailQuery.refetch()"
    />
    <button @click="toast('tes toast')">Tes toast</button>
  </section>
</template>
