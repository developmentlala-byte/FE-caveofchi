<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  DateFormatter,
  parseDate,
} from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import type { DateRange } from "reka-ui";
import { PhCalendarBlank, PhX } from "@phosphor-icons/vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    required?: boolean;
    clearable?: boolean;
    showTime?: boolean;
    numberOfMonths?: number; // ← baru
    error?: string;
    defaultStartTime?: string;
    defaultEndTime?: string;
    startTimeLabel?: string;
    endTimeLabel?: string;
  }>(),
  {
    placeholder: "Pilih tanggal",
    required: false,
    clearable: false,
    showTime: true,
    numberOfMonths: 2, // ← baru
    error: "",
    defaultStartTime: "09:00",
    defaultEndTime: "17:00",
    startTimeLabel: "Jam mulai",
    endTimeLabel: "Jam selesai",
  },
);

const start = defineModel<string>("start", { default: "" });
const end = defineModel<string>("end", { default: "" });

const open = ref(false);
const validity = ref<HTMLInputElement | null>(null);
const df = new DateFormatter("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

const datePart = (v: string) => v.slice(0, 10);
const timePart = (v: string) => v.slice(11, 16);
const toDate = (v: string): DateValue | undefined => {
  try {
    return v ? parseDate(datePart(v)) : undefined;
  } catch {
    return undefined;
  }
};

const range = ref<DateRange>({
  start: toDate(start.value),
  end: toDate(end.value),
});
const syncRange = () => {
  range.value = { start: toDate(start.value), end: toDate(end.value) };
};
watch([start, end], syncRange);
watch(open, (isOpen) => {
  if (isOpen) syncRange();
});

const label = computed(() => {
  const s = toDate(start.value);
  const e = toDate(end.value);
  if (!s) return "";
  const fmt = (d: DateValue) => df.format(d.toDate("Asia/Jakarta"));
  return !e || e.compare(s) === 0 ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
});

const timeFor = (current: string, fallback: string) =>
  props.showTime ? timePart(current) || fallback : fallback;

const onRange = (value: DateRange) => {
  range.value = value;
  if (!value.start || !value.end) return;
  start.value = `${value.start.toString()}T${timeFor(start.value, props.defaultStartTime)}`;
  end.value = `${value.end.toString()}T${timeFor(end.value, props.defaultEndTime)}`;
  open.value = false;
};

const setTime = (which: "start" | "end", value: string) => {
  const model = which === "start" ? start : end;
  if (!value || !datePart(model.value)) return;
  model.value = `${datePart(model.value)}T${value}`;
};

const clear = () => {
  start.value = "";
  end.value = "";
};

// Validasi native browser (required + urutan waktu) lewat input tersembunyi.
const applyValidity = () => validity.value?.setCustomValidity(props.error);
onMounted(applyValidity);
watch(() => props.error, applyValidity, { flush: "post" });
</script>

<template>
  <div class="relative grid gap-2">
    <input
      ref="validity"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :required="required"
      :value="start && end ? 'ok' : ''"
    />

    <div class="flex gap-2">
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <Button
            type="button"
            variant="outline"
            class="min-w-0 flex-1 justify-start gap-2 font-normal"
            :class="!label && 'text-muted-foreground'"
          >
            <PhCalendarBlank :size="16" class="shrink-0" />
            <span class="truncate">{{ label || placeholder }}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
          <RangeCalendar
            :model-value="range"
            :number-of-months="numberOfMonths"
            locale="id-ID"
            :week-starts-on="1"
            initial-focus
            @update:model-value="onRange"
          />
          <p class="border-t px-3 py-2 text-xs text-muted-foreground">
            Untuk satu hari, klik tanggal yang sama dua kali.
          </p>
        </PopoverContent>
      </Popover>

      <Button
        v-if="clearable && label"
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Kosongkan tanggal"
        @click="clear"
      >
        <PhX :size="16" />
      </Button>
    </div>

    <div v-if="showTime" class="grid grid-cols-2 gap-2">
      <div class="grid gap-1">
        <Label class="text-xs font-normal text-muted-foreground">
          {{ startTimeLabel }}
        </Label>
        <Input
          type="time"
          :model-value="timePart(start)"
          :disabled="!datePart(start)"
          @update:model-value="(v) => setTime('start', String(v))"
        />
      </div>
      <div class="grid gap-1">
        <Label class="text-xs font-normal text-muted-foreground">
          {{ endTimeLabel }}
        </Label>
        <Input
          type="time"
          :model-value="timePart(end)"
          :disabled="!datePart(end)"
          @update:model-value="(v) => setTime('end', String(v))"
        />
      </div>
    </div>

    <p v-if="error" class="text-xs text-destructive" role="alert">
      {{ error }}
    </p>
  </div>
</template>
