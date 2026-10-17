<script setup lang="ts">
import { computed, ref } from "vue";
import {
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
} from "@internationalized/date";
import type { DateRange } from "reka-ui";
import { PhInfo, PhMagnifyingGlass, PhX } from "@phosphor-icons/vue";
import DateRangePicker from "~/components/DateRangePicker.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BookingPaymentMethod,
  BookingPaymentStatus,
  BookingStatus,
} from "../../bookings/types/booking.types";

const dateRange = defineModel<DateRange>("dateRange", { required: true });
const searchInput = defineModel<string>("searchInput", { required: true });
const paymentStatus = defineModel<"" | BookingPaymentStatus>("paymentStatus", {
  required: true,
});
const bookingStatus = defineModel<"" | BookingStatus>("bookingStatus", {
  required: true,
});
const paymentMethod = defineModel<"" | BookingPaymentMethod>("paymentMethod", {
  required: true,
});

/* ---------- Select <-> model ("" <-> "all") ---------- */
const bookingStatusSelectValue = computed({
  get: () => bookingStatus.value || "all",
  set: (value: "all" | BookingStatus) => {
    bookingStatus.value = value === "all" ? "" : value;
  },
});
const paymentMethodSelectValue = computed({
  get: () => paymentMethod.value || "all",
  set: (value: "all" | BookingPaymentMethod) => {
    paymentMethod.value = value === "all" ? "" : value;
  },
});

/* ---------- Opsi ---------- */
// Warna titik status memakai token tema (success / warning / danger / muted).
const paymentStatusOptions: {
  value: "" | BookingPaymentStatus;
  label: string;
  dot: string;
}[] = [
  { value: "", label: "Semua", dot: "" },
  { value: "paid", label: "Berhasil", dot: "bg-success" },
  { value: "pending", label: "Menunggu", dot: "bg-warning" },
  { value: "failed", label: "Gagal", dot: "bg-danger" },
  { value: "expired", label: "Kedaluwarsa", dot: "bg-muted-foreground" },
];
const bookingStatusOptions: { value: "all" | BookingStatus; label: string }[] =
  [
    { value: "all", label: "Semua status booking" },
    { value: "pending_payment", label: "Menunggu pembayaran" },
    { value: "confirmed", label: "Terkonfirmasi" },
    { value: "payment_review", label: "Perlu pemeriksaan" },
    { value: "expired", label: "Kedaluwarsa" },
    { value: "cancelled", label: "Dibatalkan" },
  ];
const paymentMethodOptions: {
  value: "all" | BookingPaymentMethod;
  label: string;
}[] = [
  { value: "all", label: "Semua metode" },
  { value: "midtrans", label: "Midtrans" },
  { value: "cash", label: "Tunai" },
];

const isBookingStatus = (value: unknown): value is "all" | BookingStatus =>
  bookingStatusOptions.some((option) => option.value === value);
const isPaymentMethod = (
  value: unknown,
): value is "all" | BookingPaymentMethod =>
  paymentMethodOptions.some((option) => option.value === value);

/* ---------- Preset periode ---------- */
const tz = getLocalTimeZone();
const buildPresets = () => {
  const now = today(tz);
  const previousMonth = now.subtract({ months: 1 });
  return [
    { key: "today", label: "Hari ini", start: now, end: now },
    { key: "7d", label: "7 hari", start: now.subtract({ days: 6 }), end: now },
    {
      key: "last-month",
      label: "Bulan lalu",
      start: startOfMonth(previousMonth),
      end: endOfMonth(previousMonth),
    },
    {
      key: "month",
      label: "Bulan ini",
      start: startOfMonth(now),
      end: endOfMonth(now),
    },
  ];
};
const presetLabels = buildPresets().map(({ key, label }) => ({ key, label }));

const isPresetActive = (key: string) => {
  const preset = buildPresets().find((item) => item.key === key);
  const { start, end } = dateRange.value;
  if (!preset || !start || !end) return false;
  return start.compare(preset.start) === 0 && end.compare(preset.end) === 0;
};
const applyPreset = (key: string) => {
  const preset = buildPresets().find((item) => item.key === key);
  if (preset) dateRange.value = { start: preset.start, end: preset.end };
};

/* ---------- Filter aktif ---------- */
const activeChips = computed(() => {
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (bookingStatus.value) {
    chips.push({
      key: "booking",
      label:
        bookingStatusOptions.find((o) => o.value === bookingStatus.value)
          ?.label ?? bookingStatus.value,
      clear: () => (bookingStatus.value = ""),
    });
  }
  if (paymentMethod.value) {
    chips.push({
      key: "method",
      label:
        paymentMethodOptions.find((o) => o.value === paymentMethod.value)
          ?.label ?? paymentMethod.value,
      clear: () => (paymentMethod.value = ""),
    });
  }
  return chips;
});
const hasActiveFilters = computed(
  () => Boolean(paymentStatus.value) || activeChips.value.length > 0,
);

const resetFilters = () => {
  paymentStatus.value = "";
  bookingStatus.value = "";
  paymentMethod.value = "";
};

const showInfo = ref(false);
</script>

<template>
  <div
    class="grid gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground md:p-5"
    role="search"
    aria-label="Filter laporan pembayaran"
  >
    <!-- Baris 1: periode + pencarian -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Segmented control: token --segment HeroUI -->
        <div
          class="inline-flex rounded-field bg-surface-secondary p-1"
          role="group"
          aria-label="Periode cepat"
        >
          <button
            v-for="preset in presetLabels"
            :key="preset.key"
            type="button"
            class="h-8 rounded-md px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :class="
              isPresetActive(preset.key)
                ? 'bg-primary font-medium text-segment-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            "
            :aria-pressed="isPresetActive(preset.key)"
            @click="applyPreset(preset.key)"
          >
            {{ preset.label }}
          </button>
        </div>
        <DateRangePicker v-model="dateRange" class="max-w-full" />
      </div>

      <div class="relative w-full min-w-0 md:w-80">
        <PhMagnifyingGlass
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-field-placeholder"
          aria-hidden="true"
        />
        <Input
          v-model="searchInput"
          type="search"
          placeholder="Cari kode, customer, event..."
          aria-label="Cari transaksi"
          class="h-10 rounded-field border-border bg-field pl-9 text-field-foreground placeholder:text-field-placeholder dark:bg-field"
        />
      </div>
    </div>

    <hr class="border-separator" />

    <!-- Baris 2: status pembayaran + filter lanjutan -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div
        class="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Status pembayaran"
      >
        <button
          v-for="option in paymentStatusOptions"
          :key="option.value || 'all'"
          type="button"
          role="radio"
          :aria-checked="paymentStatus === option.value"
          class="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          :class="
            paymentStatus === option.value
              ? 'border-primary bg-segment/10 font-medium text-primary'
              : 'border-border bg-surface text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          "
          @click="paymentStatus = option.value"
        >
          <span
            v-if="option.dot"
            class="size-1.5 rounded-full"
            :class="option.dot"
            aria-hidden="true"
          />
          {{ option.label }}
        </button>
      </div>

      <div class="flex w-full flex-wrap gap-2 sm:w-auto">
        <Select
          :model-value="bookingStatusSelectValue"
          @update:model-value="
            (value) => {
              if (isBookingStatus(value)) bookingStatusSelectValue = value;
            }
          "
        >
          <SelectTrigger
            class="h-9 w-full rounded-field border-border bg-field text-field-foreground dark:bg-field sm:w-52"
            aria-label="Filter status booking"
          >
            <SelectValue placeholder="Status booking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in bookingStatusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          :model-value="paymentMethodSelectValue"
          @update:model-value="
            (value) => {
              if (isPaymentMethod(value)) paymentMethodSelectValue = value;
            }
          "
        >
          <SelectTrigger
            class="h-9 w-full rounded-field border-border bg-field text-field-foreground dark:bg-field sm:w-40"
            aria-label="Filter metode pembayaran"
          >
            <SelectValue placeholder="Metode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in paymentMethodOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Baris 3: filter aktif + info -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <span
          v-for="chip in activeChips"
          :key="chip.key"
          class="inline-flex h-7 items-center gap-1 rounded-full bg-surface-secondary pr-1 pl-3 text-xs text-surface-secondary-foreground"
        >
          {{ chip.label }}
          <button
            type="button"
            class="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-tertiary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :aria-label="`Hapus filter ${chip.label}`"
            @click="chip.clear"
          >
            <PhX class="size-3" />
          </button>
        </span>
        <Button
          v-if="hasActiveFilters"
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs text-muted-foreground"
          @click="resetFilters"
        >
          Reset filter
        </Button>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        :aria-expanded="showInfo"
        @click="showInfo = !showInfo"
      >
        <PhInfo class="size-3.5" aria-hidden="true" />
        Cara kerja periode
      </button>
    </div>

    <ul
      v-if="showInfo"
      class="grid gap-1.5 rounded-field bg-surface-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground"
    >
      <li>Periode berlaku untuk ringkasan dan daftar transaksi.</li>
      <li>
        Metrik booking mengikuti tanggal dibuat, sedangkan pendapatan mengikuti
        tanggal pembayaran berhasil.
      </li>
      <li>Filter status dan metode hanya berlaku untuk daftar transaksi.</li>
    </ul>
  </div>
</template>
