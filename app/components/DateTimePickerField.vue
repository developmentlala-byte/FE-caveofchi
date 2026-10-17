<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  DateFormatter,
  parseDate,
} from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { PhCalendarBlank } from "@phosphor-icons/vue";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    required?: boolean;
    /** Hanya dipakai untuk validasi browser; pesannya ditampilkan oleh parent. */
    error?: string;
    defaultTime?: string;
    /** Tanggal paling awal yang boleh dipilih (YYYY-MM-DD atau YYYY-MM-DDTHH:mm). */
    minDate?: string;
  }>(),
  {
    placeholder: "Pilih tanggal & jam",
    required: false,
    error: "",
    defaultTime: "09:00",
    minDate: "",
  },
);

const model = defineModel<string>({ default: "" });

const open = ref(false);
const validity = ref<HTMLInputElement | null>(null);
const dateFmt = new DateFormatter("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

const datePart = (v: string) => v.slice(0, 10);
const timePart = (v: string) => v.slice(11, 16);
const parse = (v: string): DateValue | undefined => {
  try {
    return v ? parseDate(datePart(v)) : undefined;
  } catch {
    return undefined;
  }
};

const dateValue = computed(() => parse(model.value));
const minValue = computed(() => parse(props.minDate));

const label = computed(() => {
  const date = dateValue.value;
  if (!date) return "";
  const time = timePart(model.value);
  const text = dateFmt.format(date.toDate("Asia/Jakarta"));
  return time ? `${text}, ${time}` : text;
});

const onDate = (value: DateValue | undefined) => {
  if (!value) return;
  model.value = `${value.toString()}T${timePart(model.value) || props.defaultTime}`;
};

const onTime = (value: string) => {
  if (!value || !datePart(model.value)) return;
  model.value = `${datePart(model.value)}T${value}`;
};

// Validasi native browser (required + urutan waktu) lewat input tersembunyi.
const applyValidity = () => validity.value?.setCustomValidity(props.error);
onMounted(applyValidity);
watch(() => props.error, applyValidity, { flush: "post" });
</script>

<template>
  <div class="relative">
    <input
      ref="validity"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :required="required"
      :value="model"
    />

    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          type="button"
          variant="outline"
          class="w-full justify-start gap-2 font-normal"
          :class="!label && 'text-muted-foreground'"
        >
          <PhCalendarBlank :size="16" class="shrink-0" />
          <span class="truncate">{{ label || placeholder }}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          :model-value="dateValue"
          :min-value="minValue"
          :default-placeholder="dateValue ?? minValue"
          locale="id-ID"
          :week-starts-on="1"
          initial-focus
          @update:model-value="onDate"
        />
        <div class="flex items-center gap-2 border-t p-3">
          <Label class="text-sm font-normal text-muted-foreground">Jam</Label>
          <Input
            type="time"
            lang="en-GB"
            step="60"
            aria-label="Jam"
            class="w-32"
            :model-value="timePart(model)"
            :disabled="!dateValue"
            @update:model-value="(v) => onTime(String(v))"
          />
          <Button type="button" size="sm" class="ml-auto" @click="open = false">
            Selesai
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>
