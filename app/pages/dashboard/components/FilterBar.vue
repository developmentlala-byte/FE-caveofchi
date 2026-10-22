<script setup lang="ts">
import type { DateRange } from "reka-ui";
import { computed } from "vue";
import {
  PhBuildings,
  PhCaretUpDown,
  PhCheck,
  PhDownloadSimple,
  PhFunnel,
  PhTicket,
} from "@phosphor-icons/vue";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateRangePicker from "~/components/DateRangePicker.vue";

interface Option {
  value: string;
  label: string;
}

const props = defineProps<{
  studios: { id: number; name: string }[];
  events: { id: number; name: string }[];
}>();

type SelectKey = "studio" | "status";

const range = defineModel<DateRange>("range", { required: true });
const studio = defineModel<string>("studio", { required: true });
const event = defineModel<string>("event", { required: true });
const status = defineModel<string>("status", { required: true });

const emit = defineEmits<{ export: [] }>();

// ---------------------------------------------------------------------------
// Opsi studio dan event diisi dari katalog yang dikirim API dashboard.
// ---------------------------------------------------------------------------
const studioOptions = computed<Option[]>(() => [
  { value: "all", label: "Semua studio" },
  ...props.studios.map((studio) => ({
    value: String(studio.id),
    label: studio.name,
  })),
]);
const eventOptions = computed<Option[]>(() => [
  { value: "all", label: "Semua event" },
  ...props.events.map((event) => ({
    value: String(event.id),
    label: event.name,
  })),
]);
const statusOptions: Option[] = [
  { value: "all", label: "Semua status" },
  { value: "paid", label: "Booking lunas" },
  { value: "pending", label: "Menunggu pembayaran" },
  { value: "review", label: "Perlu pemeriksaan" },
  { value: "cancelled", label: "Dibatalkan/gagal" },
  { value: "expired", label: "Kedaluwarsa" },
];

// Select biasa untuk Studio & Status
const selects = computed(() => [
  {
    key: "studio" as const,
    label: "Studio",
    icon: PhBuildings,
    options: studioOptions.value,
    value: studio.value,
  },
  {
    key: "status" as const,
    label: "Status booking",
    icon: PhFunnel,
    options: statusOptions,
    value: status.value,
  },
]);

const selectModels = { studio, status };

function updateSelect(key: SelectKey, value: unknown) {
  if (typeof value === "string" && value !== "")
    selectModels[key].value = value;
}

// Combobox Event: model luar tetap string, di dalam memakai objek Option
// supaya pencarian mengenali label ("akrilik" ketemu "Kelas Melukis Akrilik").
const selectedEvent = computed<Option | undefined>({
  get: () => eventOptions.value.find((o) => o.value === event.value),
  set: (o) => {
    // Klik item yang sama bisa mengosongkan nilai → kembalikan ke "all".
    event.value = o?.value ?? "all";
  },
});
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:flex lg:flex-wrap lg:items-end">
    <!-- Studio & Status (Select) -->
    <div
      v-for="f in selects"
      :key="f.key"
      class="flex min-w-0 flex-col gap-1.5 lg:w-48"
    >
      <!-- <label
        :for="`filter-${f.key}`"
        class="text-xs font-medium text-muted-foreground"
      >
        {{ f.label }}
      </label> -->

      <Select
        :model-value="f.value"
        @update:model-value="(v) => updateSelect(f.key, v)"
      >
        <SelectTrigger
          :id="`filter-${f.key}`"
          class="h-11 w-full rounded-full bg-background"
        >
          <div class="flex min-w-0 items-center gap-2">
            <component
              :is="f.icon"
              class="size-4 shrink-0 text-muted-foreground"
            />
            <SelectValue :placeholder="f.label" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="o in f.options" :key="o.value" :value="o.value">
            {{ o.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Event (Combobox) -->
    <div class="col-span-2 flex min-w-0 flex-col gap-1.5 lg:col-span-1 lg:w-56">
      <!-- <label
        for="filter-event"
        class="text-xs font-medium text-muted-foreground"
        >Event</label
      > -->

      <Combobox v-model="selectedEvent" by="value">
        <ComboboxAnchor as-child>
          <ComboboxTrigger as-child>
            <Button
              id="filter-event"
              type="button"
              variant="outline"
              class="h-9.5 w-full justify-between gap-2 rounded-full bg-background px-3 font-normal"
            >
              <span class="flex min-w-0 items-center gap-2">
                <PhTicket class="size-4 shrink-0 text-muted-foreground" />
                <span class="truncate">{{
                  selectedEvent?.label ?? "Pilih event"
                }}</span>
              </span>
              <PhCaretUpDown class="size-4 shrink-0 opacity-50" />
            </Button>
          </ComboboxTrigger>
        </ComboboxAnchor>

        <ComboboxList class="w-(--reka-popper-anchor-width) min-w-64">
          <ComboboxInput placeholder="Cari event…" />
          <ComboboxEmpty>Event tidak ditemukan.</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxItem v-for="o in eventOptions" :key="o.value" :value="o">
              {{ o.label }}
              <ComboboxItemIndicator>
                <PhCheck class="size-4" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </Combobox>
    </div>

    <!-- Periode -->
    <div class="col-span-2 flex min-w-0 flex-col gap-1.5 lg:col-span-1">
      <DateRangePicker
        v-model="range"
        class="w-full justify-between lg:w-auto"
      />
    </div>
  </div>
</template>
