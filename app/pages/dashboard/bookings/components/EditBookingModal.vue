<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  PhCalendarBlank,
  PhCheck,
  PhCheckCircle,
  PhClock,
  PhMinus,
  PhPlus,
  PhWarningCircle,
  PhX,
} from "@phosphor-icons/vue";
import { useApiQuery } from "~/composables/useApiQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type {
  ApiEnvelope,
  BookingSession,
  BookingUpdateInput,
  EventBooking,
} from "../types/booking.types";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  booking: EventBooking | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  submit: [values: BookingUpdateInput];
}>();

const step = ref<1 | 2>(1);
const customerName = ref("");
const customerPhone = ref("");
const selectedSessionId = ref<number | null>(null);
const quantity = ref(1);
const phoneTouched = ref(false);
const isInitializing = ref(false);

const sessionsQuery = useApiQuery<ApiEnvelope<BookingSession[]>>({
  queryKey: computed(() => ["booking-edit-sessions", props.booking?.event_id]),
  url: computed(() =>
    props.booking
      ? `/master/event/${props.booking.event_id}/session`
      : "/master/event/0/session",
  ),
  params: { per_page: 100 },
  options: {
    enabled: computed(
      () => import.meta.client && open.value && props.booking !== null,
    ),
  },
});
const sessions = computed(() => sessionsQuery.data.value?.data ?? []);
const availableSessions = computed(() =>
  sessions.value.filter(
    (session) =>
      session.is_bookable || session.id === props.booking?.session_id,
  ),
);
const selectedSession = computed(
  () =>
    availableSessions.value.find(
      (session) => session.id === selectedSessionId.value,
    ) ?? null,
);
const maxQuantity = computed(() => {
  if (!selectedSession.value) return 1;
  const heldQuantity =
    selectedSession.value.id === props.booking?.session_id
      ? props.booking.quantity
      : 0;
  return Math.min(
    20,
    selectedSession.value.available_slots + heldQuantity,
  );
});
const subtotal = computed(
  () => (selectedSession.value?.price ?? 0) * quantity.value,
);
const PHONE_REGEX = /^\+?[0-9][0-9\s().-]{7,29}$/;
const phoneInvalid = computed(
  () =>
    phoneTouched.value &&
    customerPhone.value.trim().length > 0 &&
    !PHONE_REGEX.test(customerPhone.value.trim()),
);
const canContinue = computed(
  () =>
    props.booking !== null &&
    selectedSession.value !== null &&
    customerName.value.trim().length > 0 &&
    customerName.value.trim().length <= 150 &&
    customerPhone.value.trim().length > 0 &&
    customerPhone.value.trim().length <= 30 &&
    PHONE_REGEX.test(customerPhone.value.trim()) &&
    Number.isInteger(quantity.value) &&
    quantity.value > 0 &&
    quantity.value <= maxQuantity.value,
);

watch(
  () => [open.value, props.booking] as const,
  ([isOpen, booking]) => {
    if (!isOpen || !booking) return;
    isInitializing.value = true;
    step.value = 1;
    customerName.value = booking.customer_name;
    customerPhone.value = booking.customer_phone;
    selectedSessionId.value = booking.session_id;
    quantity.value = booking.quantity;
    phoneTouched.value = false;
    queueMicrotask(() => {
      isInitializing.value = false;
    });
  },
);
watch(selectedSessionId, (nextSessionId, previousSessionId) => {
  if (
    !isInitializing.value &&
    previousSessionId !== null &&
    previousSessionId !== undefined &&
    nextSessionId !== previousSessionId
  ) {
    quantity.value = 1;
  }
});
watch(selectedSession, (session) => {
  if (session && quantity.value > maxQuantity.value) {
    quantity.value = Math.max(1, maxQuantity.value);
  }
});

const stepItems = [
  { id: 1, label: "Sesi & data" },
  { id: 2, label: "Konfirmasi" },
] as const;
const decQty = () => {
  if (quantity.value > 1) quantity.value -= 1;
};
const incQty = () => {
  if (quantity.value < maxQuantity.value) quantity.value += 1;
};
const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
const formatTimeRange = (session: BookingSession) =>
  `${formatTime(session.starts_at)} – ${formatTime(session.ends_at)}`;

const callbackUrl = (result: "success" | "cancel") => {
  const url = new URL(window.location.href);
  [
    "order_id",
    "status_code",
    "transaction_status",
    "transaction_id",
    "payment_type",
    "signature_key",
    "payment_ref",
    "result",
  ].forEach((key) => url.searchParams.delete(key));
  url.searchParams.set("payment_ref", "{referenceId}");
  url.searchParams.set("result", result);
  return url.toString();
};
const submit = () => {
  const sessionId = selectedSessionId.value;
  if (!props.booking || !canContinue.value || sessionId === null) return;

  emit("submit", {
    session_id: sessionId,
    customer_name: customerName.value.trim(),
    customer_phone: customerPhone.value.trim(),
    quantity: quantity.value,
    return_url: callbackUrl("success"),
    cancel_url: callbackUrl("cancel"),
  });
};
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="h-[85vh] max-h-[85vh] w-full gap-0 overflow-hidden rounded-t-2xl p-0 md:mx-auto md:max-w-3xl lg:max-w-5xl xl:max-w-7xl"
    >
      <DrawerHeader class="shrink-0 px-6 pt-6 pb-5 text-left">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <DrawerTitle class="text-lg font-semibold tracking-tight">
              Edit booking
            </DrawerTitle>
            <DrawerDescription class="text-sm">
              {{
                step === 1
                  ? `Perbarui sesi dan data pemesan ${booking?.booking_code ?? ""}.`
                  : "Periksa perubahan sebelum link pembayaran diperbarui."
              }}
            </DrawerDescription>
          </div>
          <DrawerClose as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="-mr-2 -mt-1 shrink-0 text-muted-foreground"
              aria-label="Tutup edit booking"
            >
              <PhX :size="18" />
            </Button>
          </DrawerClose>
        </div>

        <ol class="mt-5 flex items-center gap-3" aria-label="Langkah edit booking">
          <template v-for="(item, index) in stepItems" :key="item.id">
            <li class="flex items-center gap-2">
              <span
                class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
                :class="
                  step >= item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                "
              >
                <PhCheck v-if="step > item.id" :size="12" weight="bold" />
                <template v-else>{{ item.id }}</template>
              </span>
              <span
                class="hidden text-sm sm:inline"
                :class="
                  step >= item.id
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                "
              >
                {{ item.label }}
              </span>
            </li>
            <span
              v-if="index < stepItems.length - 1"
              class="h-px flex-1"
              :class="step > item.id ? 'bg-primary' : 'bg-border'"
            />
          </template>
        </ol>
      </DrawerHeader>

      <div
        v-if="step === 1"
        class="grid min-h-0 flex-1 border-t md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <section class="min-h-0 space-y-6 overflow-y-auto px-6 py-6">
          <div class="space-y-3">
            <div class="flex items-baseline justify-between gap-3">
              <h3 class="text-sm font-medium">Sesi dan studio</h3>
              <span
                v-if="availableSessions.length"
                class="text-xs text-muted-foreground"
              >
                {{ availableSessions.length }} tersedia
              </span>
            </div>
            <p v-if="sessionsQuery.isPending.value" class="py-6 text-sm text-muted-foreground">
              Memuat sesi...
            </p>
            <div
              v-else-if="sessionsQuery.isError.value"
              class="flex flex-col items-center gap-2 py-6 text-center"
              role="alert"
            >
              <p class="text-sm text-destructive">Daftar sesi gagal dimuat.</p>
              <Button
                type="button"
                variant="link"
                class="h-auto p-0"
                @click="sessionsQuery.refetch()"
              >
                Coba lagi
              </Button>
            </div>
            <p
              v-else-if="availableSessions.length === 0"
              class="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground"
            >
              Tidak ada sesi aktif yang tersedia untuk event ini.
            </p>
            <ul
              v-else
              class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              role="listbox"
              aria-label="Pilih studio dan sesi"
            >
              <li
                v-for="session in availableSessions"
                :key="session.id"
              >
                <button
                  type="button"
                  role="option"
                  :aria-selected="selectedSessionId === session.id"
                  class="flex h-full w-full flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  :class="
                    selectedSessionId === session.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  "
                  @click="selectedSessionId = session.id"
                >
                  <span class="flex w-full items-start justify-between gap-2">
                    <span class="text-sm font-medium">
                      {{ session.studio.name }}
                    </span>
                    <PhCheckCircle
                      v-if="selectedSessionId === session.id"
                      :size="18"
                      weight="fill"
                      class="shrink-0 text-primary"
                    />
                  </span>
                  <span class="grid gap-1 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1.5">
                      <PhCalendarBlank :size="14" />
                      {{ formatDate(session.starts_at) }}
                    </span>
                    <span class="flex items-center gap-1.5">
                      <PhClock :size="14" />
                      {{ formatTimeRange(session) }}
                    </span>
                  </span>
                  <span
                    class="mt-auto flex items-center justify-between gap-2 border-t pt-2.5"
                  >
                    <span class="text-sm font-semibold tabular-nums">
                      {{ formatPrice(session.price) }}
                    </span>
                    <span class="text-xs text-muted-foreground">
                      Sisa
                      {{
                        session.available_slots +
                        (session.id === booking?.session_id
                          ? booking.quantity
                          : 0)
                      }}
                      slot
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>

          <div
            v-if="booking"
            class="rounded-xl border bg-muted/30 p-4"
          >
            <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Event
            </p>
            <p class="mt-1 font-medium">{{ booking.event_name_snapshot }}</p>
          </div>
        </section>

        <section
          class="min-h-0 space-y-5 overflow-y-auto border-t bg-muted/30 px-6 py-6 md:border-t-0 md:border-l"
        >
          <h3 class="text-sm font-medium">Data pemesan</h3>
          <div class="grid gap-2">
            <Label for="edit-booking-customer-name">Nama customer</Label>
            <Input
              id="edit-booking-customer-name"
              v-model="customerName"
              maxlength="150"
              autocomplete="name"
              placeholder="Nama lengkap"
              class="bg-background"
            />
          </div>
          <div class="grid gap-2">
            <Label for="edit-booking-customer-phone">Nomor telepon</Label>
            <Input
              id="edit-booking-customer-phone"
              v-model="customerPhone"
              type="tel"
              inputmode="tel"
              maxlength="30"
              autocomplete="tel"
              placeholder="081234567890"
              class="bg-background"
              :aria-invalid="phoneInvalid"
              @blur="phoneTouched = true"
            />
            <p
              v-if="phoneInvalid"
              class="flex items-center gap-1 text-xs text-destructive"
            >
              <PhWarningCircle :size="14" />
              Format nomor telepon tidak valid.
            </p>
          </div>
          <div class="grid gap-2">
            <Label for="edit-booking-quantity">Jumlah slot</Label>
            <div class="flex items-center gap-3">
              <div class="inline-flex items-center rounded-lg border bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-9"
                  aria-label="Kurangi slot"
                  :disabled="!selectedSession || quantity <= 1"
                  @click="decQty"
                >
                  <PhMinus :size="14" />
                </Button>
                <input
                  id="edit-booking-quantity"
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="maxQuantity"
                  :disabled="!selectedSession"
                  class="h-9 w-12 [appearance:textfield] bg-transparent text-center text-sm font-medium tabular-nums outline-none disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-9"
                  aria-label="Tambah slot"
                  :disabled="!selectedSession || quantity >= maxQuantity"
                  @click="incQty"
                >
                  <PhPlus :size="14" />
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">
                Maks. {{ maxQuantity }} slot
              </p>
            </div>
          </div>
          <dl class="space-y-2 rounded-xl border bg-background p-4 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Metode pembayaran</dt>
              <dd class="font-medium">Midtrans</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Harga / slot</dt>
              <dd class="tabular-nums">
                {{ selectedSession ? formatPrice(selectedSession.price) : "–" }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div
        v-else
        class="min-h-0 flex-1 overflow-y-auto border-t"
      >
        <div class="mx-auto grid max-w-xl gap-6 px-6 py-8">
          <section class="space-y-3">
            <h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Event dan sesi
            </h3>
            <div>
              <p class="text-base font-semibold">
                {{ booking?.event_name_snapshot }}
              </p>
              <p class="mt-0.5 text-sm text-muted-foreground">
                {{ selectedSession?.studio.name }}
              </p>
            </div>
            <div class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span v-if="selectedSession" class="flex items-center gap-1.5">
                <PhCalendarBlank :size="15" />
                {{ formatDate(selectedSession.starts_at) }}
              </span>
              <span v-if="selectedSession" class="flex items-center gap-1.5">
                <PhClock :size="15" />
                {{ formatTimeRange(selectedSession) }}
              </span>
            </div>
          </section>

          <hr class="border-border" />

          <section class="space-y-3">
            <h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Pemesan
            </h3>
            <dl class="grid gap-2 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted-foreground">Nama</dt>
                <dd class="font-medium">{{ customerName.trim() }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted-foreground">Telepon</dt>
                <dd class="font-medium">{{ customerPhone.trim() }}</dd>
              </div>
            </dl>
          </section>

          <hr class="border-border" />

          <section class="space-y-3">
            <h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Perubahan pembayaran
            </h3>
            <dl class="grid gap-2 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted-foreground">
                  {{ quantity }} slot ×
                  {{ selectedSession ? formatPrice(selectedSession.price) : "–" }}
                </dt>
                <dd class="tabular-nums">{{ formatPrice(subtotal) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-t pt-3">
                <dt class="font-medium">Total baru</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatPrice(subtotal) }}
                </dd>
              </div>
            </dl>
            <p class="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Link pembayaran Midtrans yang lama akan dibatalkan dan diganti
              dengan link pembayaran baru sesuai total ini.
            </p>
            <p
              v-if="booking?.hold_expires_at"
              class="text-xs text-muted-foreground"
            >
              Batas pembayaran:
              <span class="font-medium text-foreground">
                {{ formatDateTime(booking.hold_expires_at) }}
              </span>
            </p>
          </section>
        </div>
      </div>

      <DrawerFooter
        class="mt-0 shrink-0 flex-row items-center gap-3 border-t bg-background px-6 py-4"
      >
        <div class="mr-auto min-w-0">
          <template v-if="selectedSession">
            <p class="text-xs text-muted-foreground">Total pembayaran baru</p>
            <p class="text-base font-semibold tabular-nums">
              {{ formatPrice(subtotal) }}
            </p>
          </template>
          <p v-else class="text-xs text-muted-foreground">
            Pilih sesi untuk melihat total.
          </p>
        </div>

        <template v-if="step === 1">
          <Button
            type="button"
            variant="ghost"
            :disabled="loading"
            @click="open = false"
          >
            Batal
          </Button>
          <Button
            type="button"
            :disabled="
              !canContinue ||
              loading ||
              sessionsQuery.isPending.value ||
              sessionsQuery.isError.value
            "
            @click="step = 2"
          >
            Tinjau perubahan
          </Button>
        </template>
        <template v-else>
          <Button
            type="button"
            variant="ghost"
            :disabled="loading"
            @click="step = 1"
          >
            Kembali
          </Button>
          <Button
            type="button"
            :disabled="loading || !canContinue"
            @click="submit"
          >
            <Spinner v-if="loading" />
            {{ loading ? "Memperbarui..." : "Konfirmasi edit" }}
          </Button>
        </template>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
