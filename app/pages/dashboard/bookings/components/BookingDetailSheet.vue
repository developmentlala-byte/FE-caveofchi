<script setup lang="ts">
import {
  PhArrowSquareOut,
  PhDownloadSimple,
  PhPencilSimple,
} from "@phosphor-icons/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  BookingPayment,
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
  EventBooking,
} from "../types/booking.types";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  booking: EventBooking | null;
  loading: boolean;
  error: boolean;
}>();
const emit = defineEmits<{
  edit: [booking: EventBooking];
  refresh: [];
}>();

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
const statusVariant = (status: BookingStatus | BookingPaymentStatus) =>
  status === "confirmed" || status === "paid"
    ? "default"
    : status === "pending_payment" || status === "pending"
      ? "secondary"
      : "outline";
const paymentMethodLabel = (method: BookingPaymentMethod) =>
  method === "cash" ? "Cash" : "Midtrans";
const latestPayment = (payments: BookingPayment[] | undefined) => payments?.[0];
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
const receiptUrl = (bookingCode: string) => {
  const apiOrigin = useRuntimeConfig().public.apiBase
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

  return `${apiOrigin}/api/public/event-bookings/${encodeURIComponent(bookingCode)}/receipt`;
};

const canEdit = (booking: EventBooking) =>
  booking.booking_status === "pending_payment" &&
  booking.payment_status === "pending" &&
  booking.payment_method === "midtrans";

const handleEdit = (booking: EventBooking) => {
  open.value = false;
  emit("edit", booking);
};
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="flex w-full flex-col gap-0 p-0 text-foreground sm:max-w-xl"
    >
      <template v-if="loading">
        <SheetHeader class="px-6 pt-12 text-left">
          <SheetTitle>Detail booking</SheetTitle>
          <SheetDescription>Memuat data booking...</SheetDescription>
        </SheetHeader>
      </template>

      <template v-else-if="error || !booking">
        <SheetHeader class="px-6 pt-12 text-left">
          <SheetTitle>Detail booking</SheetTitle>
          <SheetDescription>
            Data booking gagal dimuat atau tidak tersedia.
          </SheetDescription>
        </SheetHeader>
        <Button
          variant="outline"
          class="mx-6 mt-4 w-fit"
          @click="emit('refresh')"
        >
          Coba muat ulang
        </Button>
      </template>

      <template v-else>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pt-12 pb-6">
          <div class="grid gap-6">
            <SheetHeader class="gap-2 p-0 text-left">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <SheetTitle class="font-mono text-xl">
                    {{ booking.booking_code }}
                  </SheetTitle>
                  <SheetDescription class="mt-1">
                    Dibuat {{ formatDateTime(booking.cretime) }}
                  </SheetDescription>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Badge :variant="statusVariant(booking.booking_status)">
                    {{ BOOKING_STATUS_LABEL[booking.booking_status] }}
                  </Badge>
                  <Badge :variant="statusVariant(booking.payment_status)">
                    {{ PAYMENT_STATUS_LABEL[booking.payment_status] }}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <section class="grid gap-3">
              <h3 class="text-sm font-medium">Event dan sesi</h3>
              <dl class="divide-y rounded-xl border text-sm">
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Event</dt>
                  <dd class="text-right font-medium">
                    {{ booking.event_name_snapshot }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Studio</dt>
                  <dd class="text-right font-medium">
                    {{ booking.session_studio_snapshot }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Waktu sesi</dt>
                  <dd class="text-right font-medium">
                    {{ formatDateTime(booking.session_starts_at_snapshot) }}
                    –
                    {{ formatDateTime(booking.session_ends_at_snapshot) }}
                  </dd>
                </div>
              </dl>
            </section>

            <section class="grid gap-3">
              <h3 class="text-sm font-medium">Pemesan</h3>
              <dl class="divide-y rounded-xl border text-sm">
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Nama</dt>
                  <dd class="text-right font-medium">
                    {{ booking.customer_name }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Telepon</dt>
                  <dd class="text-right font-medium">
                    {{ booking.customer_phone }}
                  </dd>
                </div>
              </dl>
            </section>

            <section class="grid gap-3">
              <h3 class="text-sm font-medium">Pembayaran</h3>
              <dl class="divide-y rounded-xl border text-sm">
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Metode</dt>
                  <dd class="font-medium">
                    {{ paymentMethodLabel(booking.payment_method) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Jumlah slot</dt>
                  <dd class="font-medium">{{ booking.quantity }} slot</dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Harga per slot</dt>
                  <dd class="font-medium">
                    {{ formatPrice(booking.unit_price) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Total</dt>
                  <dd class="font-semibold">
                    {{ formatPrice(booking.total_amount) }}
                  </dd>
                </div>
                <template v-if="latestPayment(booking.payments)">
                  <div class="flex justify-between gap-4 px-4 py-3">
                    <dt class="text-muted-foreground">Penyedia pembayaran</dt>
                    <dd class="text-right font-medium">
                      {{ latestPayment(booking.payments)?.provider }}
                    </dd>
                  </div>
                  <div
                    v-if="latestPayment(booking.payments)?.payment_type"
                    class="flex justify-between gap-4 px-4 py-3"
                  >
                    <dt class="text-muted-foreground">Jenis pembayaran</dt>
                    <dd class="text-right font-medium">
                      {{ latestPayment(booking.payments)?.payment_type }}
                    </dd>
                  </div>
                  <div
                    v-if="latestPayment(booking.payments)?.provider_status"
                    class="flex justify-between gap-4 px-4 py-3"
                  >
                    <dt class="text-muted-foreground">Status provider</dt>
                    <dd class="text-right font-medium">
                      {{ latestPayment(booking.payments)?.provider_status }}
                    </dd>
                  </div>
                  <div
                    v-if="
                      latestPayment(booking.payments)?.provider_status_checked_at
                    "
                    class="flex justify-between gap-4 px-4 py-3"
                  >
                    <dt class="text-muted-foreground">Status diperiksa</dt>
                    <dd class="text-right font-medium">
                      {{
                        formatDateTime(
                          latestPayment(booking.payments)!
                            .provider_status_checked_at!,
                        )
                      }}
                    </dd>
                  </div>
                  <div
                    v-if="latestPayment(booking.payments)?.provider_transaction_id"
                    class="flex justify-between gap-4 px-4 py-3"
                  >
                    <dt class="text-muted-foreground">ID transaksi provider</dt>
                    <dd class="max-w-[60%] break-all text-right font-mono text-xs">
                      {{ latestPayment(booking.payments)?.provider_transaction_id }}
                    </dd>
                  </div>
                </template>
                <div
                  v-if="booking.hold_expires_at && booking.payment_status === 'pending'"
                  class="flex justify-between gap-4 px-4 py-3"
                >
                  <dt class="text-muted-foreground">Batas pembayaran</dt>
                  <dd class="text-right font-medium">
                    {{ formatDateTime(booking.hold_expires_at) }}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <div
          v-if="canEdit(booking) || booking.payment_status === 'paid'"
          class="grid gap-2 border-t px-6 py-4 sm:grid-cols-2"
        >
          <Button
            v-if="canEdit(booking)"
            class="gap-2"
            @click="handleEdit(booking)"
          >
            <PhPencilSimple :size="16" />
            Edit booking
          </Button>
          <Button
            v-if="booking.payments?.[0]?.redirect_url"
            as-child
            variant="outline"
            class="gap-2"
          >
            <a
              :href="booking.payments[0].redirect_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lanjut bayar
              <PhArrowSquareOut :size="16" />
            </a>
          </Button>
          <Button
            v-if="booking.payment_status === 'paid'"
            as-child
            variant="outline"
            class="gap-2"
          >
            <a
              :href="receiptUrl(booking.booking_code)"
              target="_blank"
              rel="noopener noreferrer"
            >
              Unduh kwitansi
              <PhDownloadSimple :size="16" />
            </a>
          </Button>
        </div>
      </template>
    </SheetContent>
  </Sheet>
</template>
