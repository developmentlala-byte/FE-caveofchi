<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from "vue";
import {
  PhArrowSquareOut,
  PhCalendarBlank,
  PhCaretDown,
  PhCheck,
  PhCheckCircle,
  PhClock,
  PhMagnifyingGlass,
  PhMinus,
  PhPlus,
  PhTicket,
  PhWarningCircle,
  PhX,
} from "@phosphor-icons/vue";
import type {
  ApiEnvelope,
  BookingPaymentMethod,
  BookingSession,
  EventBooking,
} from "../types/booking.types";
import type { Event as EventModel } from "~/pages/dashboard/master/events/types/event.types";
import { useApiPost } from "~/composables/useApiMutation";
import { useApiQuery } from "~/composables/useApiQuery";
import { ApiError } from "~/utils/api-error";
import { withToastPromise } from "~/utils/toast-promise";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const open = defineModel<boolean>("open", { required: true });
const paymentMethod = defineModel<BookingPaymentMethod>("paymentMethod", {
  default: "midtrans",
});
const emit = defineEmits<{ created: [booking: EventBooking] }>();

const step = ref<1 | 2 | 3>(1);
const eventSearch = ref("");
const debouncedEventSearch = ref("");
const eventPage = ref(1);
const eventPageSize = 6;
const selectedEventId = ref<number | null>(null);
const selectedEventSnapshot = ref<EventModel | null>(null);
const selectedSessionId = ref<number | null>(null);
const customerName = ref("");
const customerPhone = ref("");
const quantity = ref(1);
const idempotencyKey = ref("");
const hasAttempted = ref(false);
const createdBooking = ref<EventBooking | null>(null);
const phoneTouched = ref(false);

let eventSearchTimer: ReturnType<typeof setTimeout> | undefined;
watch(eventSearch, (value) => {
  clearTimeout(eventSearchTimer);
  eventSearchTimer = setTimeout(() => {
    debouncedEventSearch.value = value.trim();
    eventPage.value = 1;
  }, 300);
});
onScopeDispose(() => clearTimeout(eventSearchTimer));

const eventQueryParams = computed(() => ({
  // status: "published",
  page: eventPage.value,
  per_page: eventPageSize,
  ...(debouncedEventSearch.value ? { search: debouncedEventSearch.value } : {}),
}));
const eventsQuery = useApiQuery<ApiEnvelope<EventModel[]>>({
  queryKey: computed(() => ["booking-event-options", eventQueryParams.value]),
  url: "/master/event",
  params: eventQueryParams,
  options: { enabled: computed(() => import.meta.client && open.value) },
});
const events = computed(() => eventsQuery.data.value?.data ?? []);
const eventMeta = computed(() => eventsQuery.data.value?.meta);
const selectedEvent = computed(
  () =>
    events.value.find((event) => event.id === selectedEventId.value) ??
    (selectedEventSnapshot.value?.id === selectedEventId.value
      ? selectedEventSnapshot.value
      : null),
);

const sessionsQuery = useApiQuery<ApiEnvelope<BookingSession[]>>({
  queryKey: computed(() => ["booking-session-options", selectedEventId.value]),
  url: computed(() =>
    selectedEventId.value === null
      ? "/master/event/0/session"
      : `/master/event/${selectedEventId.value}/session`,
  ),
  params: { per_page: 100 },
  options: {
    enabled: computed(
      () => import.meta.client && open.value && selectedEventId.value !== null,
    ),
  },
});
const displayedSessions = computed(() =>
  (sessionsQuery.data.value?.data ?? []).filter(
    (session) => session.is_bookable || session.available_slots === 0,
  ),
);
const bookableSessions = computed(() =>
  displayedSessions.value.filter((session) => session.is_bookable),
);
const selectedSession = computed(
  () =>
    bookableSessions.value.find(
      (session) => session.id === selectedSessionId.value,
    ) ?? null,
);
const maxQuantity = computed(() =>
  selectedSession.value
    ? Math.min(20, selectedSession.value.available_slots)
    : 1,
);
const subtotal = computed(
  () => (selectedSession.value?.price ?? 0) * quantity.value,
);

const createBooking = useApiPost<
  ApiEnvelope<EventBooking>,
  {
    session_id: number;
    customer_name: string;
    customer_phone: string;
    quantity: number;
    payment_method: BookingPaymentMethod;
    idempotency_key: string;
    return_url: string;
    cancel_url: string;
  }
>({
  url: "/master/event-booking",
  invalidateKeys: [
    ["event-bookings"],
    ["booking-session-options"],
    ["booking-edit-sessions"],
  ],
  options: { meta: { silentError: true } },
});

const TZ = "Asia/Jakarta";
const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(new Date(value));
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(value));
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
const formatTimeRange = (session: BookingSession) =>
  `${formatTime(session.starts_at)} – ${formatTime(session.ends_at)}`;
const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const newIdempotencyKey = () => crypto.randomUUID();

const paymentLabel = computed(() =>
  paymentMethod.value === "cash" ? "Tunai (Cash)" : "Midtrans",
);

const stepItems = [
  { id: 1, label: "Sesi & data" },
  { id: 2, label: "Konfirmasi" },
  { id: 3, label: "Selesai" },
] as const;

watch(open, (isOpen) => {
  if (isOpen) {
    step.value = 1;
    eventSearch.value = "";
    debouncedEventSearch.value = "";
    eventPage.value = 1;
    selectedEventId.value = events.value[0]?.id ?? null;
    selectedEventSnapshot.value = events.value[0] ?? null;
    selectedSessionId.value = null;
    customerName.value = "";
    customerPhone.value = "";
    phoneTouched.value = false;
    quantity.value = 1;
    idempotencyKey.value = newIdempotencyKey();
    hasAttempted.value = false;
    createdBooking.value = null;
  }
});
watch(events, (items) => {
  const firstEvent = items.at(0);
  if (!open.value || !firstEvent) return;

  const selectedOnPage = items.find(
    (event) => event.id === selectedEventId.value,
  );
  if (selectedOnPage) {
    selectedEventSnapshot.value = selectedOnPage;
  } else if (selectedEventId.value === null) {
    selectedEventId.value = firstEvent.id;
    selectedEventSnapshot.value = firstEvent;
  }
});
watch(selectedEventId, () => {
  selectedSessionId.value = null;
});
watch(selectedSessionId, () => {
  quantity.value = 1;
});
watch(selectedSession, (session) => {
  if (session && quantity.value > session.available_slots) {
    quantity.value = Math.max(1, maxQuantity.value);
  }
});
watch(
  [selectedSessionId, customerName, customerPhone, quantity, paymentMethod],
  () => {
    if (!hasAttempted.value) return;
    idempotencyKey.value = newIdempotencyKey();
    hasAttempted.value = false;
  },
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
    selectedSession.value !== null &&
    customerName.value.trim().length > 0 &&
    customerName.value.trim().length <= 150 &&
    customerPhone.value.trim().length > 0 &&
    customerPhone.value.length <= 30 &&
    PHONE_REGEX.test(customerPhone.value.trim()) &&
    Number.isInteger(quantity.value) &&
    quantity.value > 0 &&
    quantity.value <= maxQuantity.value,
);

const decQty = () => {
  if (quantity.value > 1) quantity.value -= 1;
};
const incQty = () => {
  if (quantity.value < maxQuantity.value) quantity.value += 1;
};

const midtransCallbackUrl = (result: "success" | "cancel") => {
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

const submitBooking = async () => {
  const session = selectedSession.value;
  if (!session || !canContinue.value || createBooking.isPending.value) return;

  hasAttempted.value = true;
  await withToastPromise(
    async () => {
      try {
        const response = await createBooking.mutateAsync({
          session_id: session.id,
          customer_name: customerName.value.trim(),
          customer_phone: customerPhone.value.trim(),
          quantity: quantity.value,
          payment_method: paymentMethod.value,
          idempotency_key: idempotencyKey.value,
          return_url: midtransCallbackUrl("success"),
          cancel_url: midtransCallbackUrl("cancel"),
        });
        createdBooking.value = response.data;
        step.value = 3;
        emit("created", response.data);
        return {
          title: "Booking berhasil dibuat",
          description: `${response.data.booking_code} · ${
            selectedEvent.value?.name ?? "Event"
          } · ${formatDateTime(session.starts_at)}`,
        };
      } catch (error) {
        if (ApiError.from(error).status === 502) {
          idempotencyKey.value = newIdempotencyKey();
          hasAttempted.value = false;
        }
        throw error;
      }
    },
    {
      loading: "Membuat booking...",
      success: (message) => message,
      error: (error) => ({
        title: "Booking gagal dibuat",
        description: ApiError.from(error).userMessage,
        duration: 6000,
      }),
    },
  );
};
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerContent
      class="h-[85vh] max-h-[85vh] w-full gap-0 overflow-hidden rounded-t-2xl p-0 md:mx-auto md:max-w-3xl lg:max-w-5xl xl:max-w-7xl"
    >
      <!-- Header -->
      <DrawerHeader class="shrink-0 px-6 pt-6 pb-5 text-left">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <DrawerTitle class="text-lg font-semibold tracking-tight">
              {{ step === 3 ? "Booking berhasil" : "Booking baru" }}
            </DrawerTitle>
            <DrawerDescription class="text-sm">
              {{
                step === 1
                  ? "Pilih event, sesi, lalu isi data pemesan."
                  : step === 2
                    ? "Periksa kembali sebelum dikonfirmasi."
                    : "Booking sudah tercatat di sistem."
              }}
            </DrawerDescription>
          </div>
          <DrawerClose as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="-mr-2 -mt-1 shrink-0 text-muted-foreground"
              aria-label="Tutup booking"
            >
              <PhX :size="18" />
            </Button>
          </DrawerClose>
        </div>

        <!-- Stepper -->
        <ol class="mt-5 flex items-center gap-3" aria-label="Langkah booking">
          <template v-for="(item, index) in stepItems" :key="item.id">
            <li class="flex items-center gap-2">
              <span
                class="flex size-6 items-center justify-center rounded-full text-xs font-medium transition-colors"
                :class="
                  step > item.id
                    ? 'bg-primary text-primary-foreground'
                    : step === item.id
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
              class="h-px flex-1 transition-colors"
              :class="step > item.id ? 'bg-primary' : 'bg-border'"
            />
          </template>
        </ol>
      </DrawerHeader>

      <!-- Step 1 -->
      <div
        v-if="step === 1"
        class="grid min-h-0 flex-1 border-t md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <!-- Left: event + sesi -->
        <section class="min-h-0 space-y-6 overflow-y-auto px-6 py-6">
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Event</h3>
            <div class="relative">
              <PhMagnifyingGlass
                :size="16"
                class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="booking-event-search"
                v-model="eventSearch"
                class="pl-9"
                placeholder="Cari nama atau kode event"
                aria-label="Cari event"
              />
            </div>

            <p
              v-if="eventsQuery.isPending.value"
              class="py-6 text-center text-sm text-muted-foreground"
            >
              Memuat event...
            </p>
            <div
              v-else-if="eventsQuery.isError.value"
              class="flex flex-col items-center gap-1 py-6 text-center"
            >
              <p class="text-sm text-destructive">Daftar event gagal dimuat.</p>
              <Button
                variant="link"
                class="h-auto p-0"
                @click="eventsQuery.refetch()"
              >
                Coba lagi
              </Button>
            </div>
            <p
              v-else-if="events.length === 0 && !debouncedEventSearch"
              class="py-6 text-center text-sm text-muted-foreground"
            >
              Belum ada event terbit.
            </p>
            <p
              v-else-if="events.length === 0 && debouncedEventSearch"
              class="py-6 text-center text-sm text-muted-foreground"
            >
              Event tidak ditemukan.
            </p>
            <ul
              v-else
              class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              role="listbox"
              aria-label="Event"
            >
              <li v-for="event in events" :key="event.id">
                <button
                  type="button"
                  role="option"
                  :aria-selected="selectedEventId === event.id"
                  class="flex h-full w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  :class="
                    selectedEventId === event.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  "
                  @click="
                    selectedEventId = event.id;
                    selectedEventSnapshot = event;
                  "
                >
                  <img
                    v-if="event.cover_image_url"
                    :src="event.cover_image_url"
                    :alt="`Sampul ${event.name}`"
                    class="size-11 shrink-0 rounded-lg object-cover"
                  />
                  <span
                    v-else
                    class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted"
                  >
                    <PhTicket :size="18" class="text-muted-foreground" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium">{{
                      event.name
                    }}</span>
                    <span class="block text-xs text-muted-foreground">{{
                      event.code
                    }}</span>
                  </span>
                  <PhCheckCircle
                    v-if="selectedEventId === event.id"
                    :size="20"
                    weight="fill"
                    class="shrink-0 text-primary"
                  />
                </button>
              </li>
            </ul>
            <div
              v-if="(eventMeta?.last_page ?? 1) > 1"
              class="flex items-center justify-between gap-3"
              aria-label="Navigasi halaman event"
            >
              <Button
                variant="outline"
                size="sm"
                :disabled="eventPage <= 1 || eventsQuery.isFetching.value"
                @click="eventPage--"
              >
                Sebelumnya
              </Button>
              <span class="text-xs text-muted-foreground" aria-live="polite">
                Halaman {{ eventMeta?.current_page ?? eventPage }} dari
                {{ eventMeta?.last_page }}
              </span>
              <Button
                variant="outline"
                size="sm"
                :disabled="
                  eventPage >= (eventMeta?.last_page ?? 1) ||
                  eventsQuery.isFetching.value
                "
                @click="eventPage++"
              >
                Berikutnya
              </Button>
            </div>
          </div>

          <!-- Sesi -->
          <div v-if="selectedEvent" class="space-y-3">
            <div class="flex items-baseline justify-between">
              <h3 class="text-sm font-medium">Sesi</h3>
              <span
                v-if="displayedSessions.length"
                class="text-xs text-muted-foreground"
              >
                {{ bookableSessions.length }} tersedia
                <template
                  v-if="displayedSessions.length > bookableSessions.length"
                >
                  ·
                  {{ displayedSessions.length - bookableSessions.length }} penuh
                </template>
              </span>
            </div>

            <p
              v-if="sessionsQuery.isPending.value"
              class="py-4 text-sm text-muted-foreground"
            >
              Memuat sesi...
            </p>
            <div v-else-if="sessionsQuery.isError.value" class="py-2">
              <p class="text-sm text-destructive">Sesi gagal dimuat.</p>
              <Button
                variant="link"
                class="h-auto p-0"
                @click="sessionsQuery.refetch()"
              >
                Coba lagi
              </Button>
            </div>
            <p
              v-else-if="displayedSessions.length === 0"
              class="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground"
            >
              Tidak ada sesi yang sedang bisa dipesan.
            </p>
            <ul
              v-else
              class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              role="listbox"
              aria-label="Sesi"
            >
              <li v-for="session in displayedSessions" :key="session.id">
                <button
                  type="button"
                  role="option"
                  :aria-selected="selectedSessionId === session.id"
                  :disabled="
                    !session.is_bookable || session.available_slots === 0
                  "
                  class="flex h-full w-full flex-col gap-2.5 rounded-xl border p-3.5 text-left transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-transparent"
                  :class="
                    selectedSessionId === session.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  "
                  @click="selectedSessionId = session.id"
                >
                  <span class="text-sm font-medium">{{
                    session.studio.name
                  }}</span>
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
                    <span class="text-sm font-semibold tabular-nums">{{
                      formatPrice(session.price)
                    }}</span>
                    <span
                      class="text-xs font-medium"
                      :class="
                        session.available_slots === 0
                          ? 'text-destructive'
                          : session.available_slots <= 5
                            ? 'text-amber-600'
                            : 'text-muted-foreground'
                      "
                    >
                      {{
                        session.available_slots === 0
                          ? "Penuh · 0 slot"
                          : `Sisa ${session.available_slots} slot`
                      }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </section>

        <!-- Right: data pemesan -->
        <section
          class="min-h-0 space-y-5 overflow-y-auto border-t bg-muted/30 px-6 py-6 md:border-t-0 md:border-l"
        >
          <h3 class="text-sm font-medium">Data pemesan</h3>

          <div class="grid gap-2">
            <Label for="booking-customer-name">Nama customer</Label>
            <Input
              id="booking-customer-name"
              v-model="customerName"
              maxlength="150"
              autocomplete="name"
              placeholder="Nama lengkap"
              class="bg-background"
            />
          </div>

          <div class="grid gap-2">
            <Label for="booking-customer-phone">Nomor telepon</Label>
            <Input
              id="booking-customer-phone"
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
            <Label for="booking-quantity">Jumlah slot</Label>
            <div class="flex items-center gap-3">
              <div
                class="inline-flex items-center rounded-lg border bg-background"
              >
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
                  id="booking-quantity"
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

          <dl
            class="space-y-2 rounded-xl border bg-background p-4 text-sm"
            aria-label="Ringkasan"
          >
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Pembayaran</dt>
              <dd class="font-medium">{{ paymentLabel }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Harga / slot</dt>
              <dd class="tabular-nums">
                {{ selectedSession ? formatPrice(selectedSession.price) : "–" }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Jumlah slot</dt>
              <dd class="tabular-nums">{{ quantity }}</dd>
            </div>
            <div class="flex justify-between gap-4 border-t pt-2">
              <dt class="font-medium">Total</dt>
              <dd class="font-semibold tabular-nums">
                {{ selectedSession ? formatPrice(subtotal) : "–" }}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- Step 2: konfirmasi -->
      <div
        v-else-if="step === 2"
        class="min-h-0 flex-1 overflow-y-auto border-t"
      >
        <div
          v-if="selectedSession && selectedEvent"
          class="mx-auto grid max-w-xl gap-6 px-6 py-8"
        >
          <section class="space-y-3">
            <h3
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Event
            </h3>
            <div>
              <p class="text-base font-semibold">{{ selectedEvent.name }}</p>
              <p class="mt-0.5 text-sm text-muted-foreground">
                {{ selectedSession.studio.name }}
              </p>
            </div>
            <div
              class="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"
            >
              <span class="flex items-center gap-1.5">
                <PhCalendarBlank :size="15" />
                {{ formatDate(selectedSession.starts_at) }}
              </span>
              <span class="flex items-center gap-1.5">
                <PhClock :size="15" />
                {{ formatTimeRange(selectedSession) }}
              </span>
            </div>
          </section>

          <hr class="border-border" />

          <section class="space-y-3">
            <h3
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
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
            <h3
              class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Pembayaran
            </h3>
            <dl class="grid gap-2 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-muted-foreground">
                  {{ quantity }} slot × {{ formatPrice(selectedSession.price) }}
                </dt>
                <dd class="tabular-nums">{{ formatPrice(subtotal) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-muted-foreground">Metode</dt>
                <dd class="font-medium">{{ paymentLabel }}</dd>
              </div>
              <div
                class="mt-1 flex items-baseline justify-between gap-4 border-t pt-3"
              >
                <dt class="font-medium">Total</dt>
                <dd class="text-lg font-semibold tabular-nums">
                  {{ formatPrice(subtotal) }}
                </dd>
              </div>
            </dl>
            <p
              class="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
            >
              {{
                paymentMethod === "cash"
                  ? "Booking akan langsung dicatat lunas secara tunai."
                  : "Slot ditahan selama 15 menit. Pembayaran diverifikasi otomatis oleh Midtrans."
              }}
            </p>
          </section>
        </div>
      </div>

      <!-- Step 3: sukses -->
      <div
        v-else-if="step === 3 && createdBooking"
        class="min-h-0 flex-1 overflow-y-auto border-t"
      >
        <div class="mx-auto grid max-w-md gap-6 px-6 py-10 text-center">
          <div class="flex flex-col items-center gap-3">
            <PhCheckCircle
              :size="48"
              weight="fill"
              :class="
                createdBooking.payment_status === 'paid'
                  ? 'text-emerald-500'
                  : 'text-amber-500'
              "
            />
            <div>
              <p class="text-sm text-muted-foreground">Kode booking</p>
              <p class="mt-1 font-mono text-2xl font-semibold tracking-wide">
                {{ createdBooking.booking_code }}
              </p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              :class="
                createdBooking.payment_status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-amber-500/10 text-amber-600'
              "
            >
              {{
                createdBooking.payment_status === "paid"
                  ? "Lunas"
                  : "Menunggu pembayaran"
              }}
            </span>
          </div>

          <dl class="grid gap-2 rounded-xl border p-4 text-left text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Event</dt>
              <dd class="text-right font-medium">
                {{ createdBooking.event_name_snapshot }}
              </dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-muted-foreground">Jumlah</dt>
              <dd class="font-medium">{{ createdBooking.quantity }} slot</dd>
            </div>
            <div class="flex justify-between gap-4 border-t pt-2">
              <dt class="font-medium">Total</dt>
              <dd class="font-semibold tabular-nums">
                {{ formatPrice(createdBooking.total_amount) }}
              </dd>
            </div>
          </dl>

          <p
            v-if="createdBooking.hold_expires_at"
            class="text-xs text-muted-foreground"
          >
            Selesaikan pembayaran sebelum
            <span class="font-medium text-foreground">{{
              formatDateTime(createdBooking.hold_expires_at)
            }}</span>
          </p>

          <a
            v-if="createdBooking.payments?.[0]?.redirect_url"
            :href="createdBooking.payments[0].redirect_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buka halaman pembayaran
            <PhArrowSquareOut :size="16" />
          </a>
          <p
            v-else-if="createdBooking.payment_method === 'midtrans'"
            class="flex items-start justify-center gap-1.5 text-sm text-destructive"
          >
            <PhWarningCircle :size="16" class="mt-0.5 shrink-0" />
            Link pembayaran belum tersedia. Periksa detail booking atau coba
            buat booking baru.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <DrawerFooter
        class="mt-0 shrink-0 flex-row items-center gap-3 border-t bg-background px-6 py-4"
      >
        <div v-if="step < 3" class="mr-auto min-w-0">
          <template v-if="selectedSession">
            <p class="text-xs text-muted-foreground">Total</p>
            <p class="text-base font-semibold tabular-nums">
              {{ formatPrice(subtotal) }}
            </p>
          </template>
          <p v-else class="text-xs text-muted-foreground">
            Pilih sesi untuk melihat total.
          </p>
        </div>

        <template v-if="step === 1">
          <Button type="button" variant="ghost" @click="open = false">
            Batal
          </Button>
          <Button
            type="button"
            :disabled="
              !canContinue ||
              eventsQuery.isError.value ||
              sessionsQuery.isError.value
            "
            @click="step = 2"
          >
            Lanjut
          </Button>
        </template>
        <template v-else-if="step === 2">
          <Button
            type="button"
            variant="ghost"
            :disabled="createBooking.isPending.value"
            @click="step = 1"
          >
            Ubah sesi
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                variant="outline"
                class="gap-2"
                :disabled="createBooking.isPending.value"
                aria-label="Pilih metode pembayaran"
              >
                {{ paymentLabel }}
                <PhCaretDown :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @select="paymentMethod = 'cash'">
                <PhCheck v-if="paymentMethod === 'cash'" :size="16" />
                <span v-else class="w-4" />
                Cash
              </DropdownMenuItem>
              <DropdownMenuItem @select="paymentMethod = 'midtrans'">
                <PhCheck v-if="paymentMethod === 'midtrans'" :size="16" />
                <span v-else class="w-4" />
                Payment Gateway · Midtrans
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            :disabled="createBooking.isPending.value"
            @click="submitBooking"
          >
            {{
              createBooking.isPending.value
                ? "Memproses..."
                : "Konfirmasi booking"
            }}
          </Button>
        </template>
        <Button v-else type="button" class="ml-auto" @click="open = false">
          Selesai
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
