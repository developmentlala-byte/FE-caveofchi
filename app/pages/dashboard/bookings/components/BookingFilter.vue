<script setup lang="ts">
import { computed } from "vue";
import { PhFunnel, PhMagnifyingGlass } from "@phosphor-icons/vue";
import { Badge } from "@/components/ui/badge";
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
  BookingPaymentStatus,
  BookingStatus,
} from "../types/booking.types";

const searchInput = defineModel<string>("searchInput", { required: true });
const bookingStatus = defineModel<"" | BookingStatus>("bookingStatus", {
  required: true,
});
const paymentStatus = defineModel<"" | BookingPaymentStatus>("paymentStatus", {
  required: true,
});

const bookingStatusSelectValue = computed({
  get: () => bookingStatus.value || "all",
  set: (value: "all" | BookingStatus) => {
    bookingStatus.value = value === "all" ? "" : value;
  },
});
const paymentStatusSelectValue = computed({
  get: () => paymentStatus.value || "all",
  set: (value: "all" | BookingPaymentStatus) => {
    paymentStatus.value = value === "all" ? "" : value;
  },
});

const bookingStatusOptions: { value: "all" | BookingStatus; label: string }[] =
  [
    { value: "all", label: "Semua status booking" },
    { value: "pending_payment", label: "Menunggu pembayaran" },
    { value: "confirmed", label: "Terkonfirmasi" },
    { value: "payment_review", label: "Perlu pemeriksaan" },
    { value: "expired", label: "Kedaluwarsa" },
    { value: "cancelled", label: "Dibatalkan" },
  ];
const paymentStatusOptions: {
  value: "all" | BookingPaymentStatus;
  label: string;
}[] = [
  { value: "all", label: "Semua pembayaran" },
  { value: "pending", label: "Belum dibayar" },
  { value: "paid", label: "Lunas" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kedaluwarsa" },
];

const isBookingStatus = (value: unknown): value is "all" | BookingStatus =>
  bookingStatusOptions.some((option) => option.value === value);
const isPaymentStatus = (
  value: unknown,
): value is "all" | BookingPaymentStatus =>
  paymentStatusOptions.some((option) => option.value === value);
</script>

<template>
  <div
    class="grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:p-4"
  >
    <div class="relative min-w-0 sm:col-span-2 md:col-span-1">
      <PhMagnifyingGlass
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="searchInput"
        type="search"
        placeholder="Cari kode, customer, event, telepon..."
        aria-label="Cari booking"
        class="h-9 rounded-xl bg-background pl-9"
      />
    </div>

    <Select
      :model-value="bookingStatusSelectValue"
      @update:model-value="
        (value) => {
          if (isBookingStatus(value)) bookingStatusSelectValue = value;
        }
      "
    >
      <SelectTrigger
        class="h-10 w-full rounded-xl bg-background md:w-56"
        aria-label="Filter status booking"
      >
        <PhFunnel class="size-4 text-muted-foreground" />
        <SelectValue placeholder="Filter status booking" />
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
      :model-value="paymentStatusSelectValue"
      @update:model-value="
        (value) => {
          if (isPaymentStatus(value)) paymentStatusSelectValue = value;
        }
      "
    >
      <SelectTrigger
        class="h-10 w-full rounded-xl bg-background md:w-52"
        aria-label="Filter status pembayaran"
      >
        <SelectValue placeholder="Filter pembayaran" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in paymentStatusOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Badge
      v-if="bookingStatus !== '' || paymentStatus !== ''"
      variant="secondary"
      class="h-8 w-fit rounded-full px-3 sm:col-span-2 md:col-span-3"
    >
      <span class="flex items-center gap-2">
        <span v-if="bookingStatus !== ''">
          {{
            bookingStatusOptions.find(
              (option) => option.value === bookingStatus,
            )?.label
          }}
        </span>
        <span
          v-if="bookingStatus !== '' && paymentStatus !== ''"
          aria-hidden="true"
        >
          ·
        </span>
        <span v-if="paymentStatus !== ''">
          {{
            paymentStatusOptions.find(
              (option) => option.value === paymentStatus,
            )?.label
          }}
        </span>
        <Button
          variant="ghost"
          size="sm"
          class="ml-1 h-6 px-1.5 text-xs"
          @click="
            () => {
              bookingStatus = '';
              paymentStatus = '';
            }
          "
        >
          Reset
        </Button>
      </span>
    </Badge>
  </div>
</template>
