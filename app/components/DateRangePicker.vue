<script setup lang="ts">
import type { DateValue } from "@internationalized/date";
import type { DateRange } from "reka-ui";
import type { HTMLAttributes } from "vue";
import {
  DateFormatter,
  endOfMonth,
  getLocalTimeZone,
  isSameDay,
  startOfMonth,
} from "@internationalized/date";
import {
  PhCalendarBlank,
  PhCaretLeft,
  PhCaretRight,
} from "@phosphor-icons/vue";
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from "reka-ui";
import { computed, ref } from "vue";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** Locale untuk format tanggal & nama hari/bulan. Pakai "en-US" kalau mau persis seperti screenshot. */
    locale?: string;
    placeholder?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    locale: "id-ID",
    placeholder: "Pilih rentang tanggal",
  },
);

const model = defineModel<DateRange>({ required: true });

const open = ref(false);
const timeZone = getLocalTimeZone();

const formatter = computed(
  () => new DateFormatter(props.locale, { dateStyle: "medium" }),
);

const label = computed(() => {
  const { start, end } = model.value;
  if (!start) return props.placeholder;
  const from = formatter.value.format(start.toDate(timeZone));
  if (!end) return from;
  return `${from} – ${formatter.value.format(end.toDate(timeZone))}`;
});

/**
 * Tombol panah di luar popover:
 * - kalau rentang = 1 bulan penuh → pindah bulan penuh sebelumnya / berikutnya
 * - selain itu → geser sebesar panjang rentang (mis. 7 hari → mundur/maju 7 hari)
 */
function shift(direction: 1 | -1) {
  const { start, end } = model.value;
  if (!start || !end) return;

  const isFullMonth = start.day === 1 && isSameDay(end, endOfMonth(start));

  if (isFullMonth) {
    const target = start.add({ months: direction });
    model.value = { start: startOfMonth(target), end: endOfMonth(target) };
    return;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const span =
    Math.round(
      (end.toDate(timeZone).getTime() - start.toDate(timeZone).getTime()) /
        dayMs,
    ) + 1;
  model.value = {
    start: start.add({ days: span * direction }),
    end: end.add({ days: span * direction }),
  };
}

function onSelect(value: DateRange) {
  model.value = value;
  // reka-ui memancarkan start & end sekaligus hanya setelah klik kedua,
  // jadi popover aman ditutup begitu keduanya terisi.
  if (value.start && value.end) open.value = false;
}

function cellKey(date: DateValue) {
  return date.toString();
}
</script>

<template>
  <div
    :class="
      cn(
        'inline-flex h-11 items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-sm',
        props.class,
      )
    "
  >
    <Button
      variant="ghost"
      size="icon"
      class="size-9 shrink-0 rounded-full text-muted-foreground"
      aria-label="Rentang sebelumnya"
      @click="shift(-1)"
    >
      <PhCaretLeft weight="bold" class="size-4" />
    </Button>

    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-bold text-foreground outline-none transition-colors hover:bg-surface-secondary/60 focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
        >
          <PhCalendarBlank
            weight="bold"
            class="size-4 shrink-0 text-muted-foreground"
          />
          <span class="whitespace-nowrap">{{ label }}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        class="z-[100] w-auto rounded-3xl border-border bg-popover p-4 shadow-xl"
      >
        <RangeCalendarRoot
          v-slot="{ weekDays, grid }"
          :model-value="model"
          :locale="locale"
          :week-starts-on="0"
          aria-label="Pilih rentang tanggal"
          @update:model-value="onSelect"
        >
          <RangeCalendarHeader class="flex items-center justify-between pb-3">
            <RangeCalendarHeading
              class="text-sm font-semibold text-foreground"
            />
            <div class="flex items-center gap-1">
              <RangeCalendarPrev
                :class="
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'size-8 rounded-full text-muted-foreground',
                  )
                "
              >
                <PhCaretLeft weight="bold" class="size-4" />
              </RangeCalendarPrev>
              <RangeCalendarNext
                :class="
                  cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'size-8 rounded-full text-muted-foreground',
                  )
                "
              >
                <PhCaretRight weight="bold" class="size-4" />
              </RangeCalendarNext>
            </div>
          </RangeCalendarHeader>

          <RangeCalendarGrid
            v-for="month in grid"
            :key="month.value.toString()"
            class="w-full border-collapse"
          >
            <RangeCalendarGridHead>
              <RangeCalendarGridRow class="flex">
                <RangeCalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="flex size-10 items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>

            <RangeCalendarGridBody>
              <RangeCalendarGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`week-${index}`"
                class="mt-1 flex w-full"
              >
                <!--
                  Pita (band) rentang ada di <td>, bukan di tombol tanggal:
                  - bg-primary/15 muncul kalau sel berisi tanggal terpilih
                  - ujung kiri/kanan dibulatkan di awal/akhir baris minggu
                    dan di tanggal start/end supaya tampil seperti pil
                -->
                <RangeCalendarCell
                  v-for="weekDate in weekDates"
                  :key="cellKey(weekDate)"
                  :date="weekDate"
                  class="relative flex size-10 items-center justify-center p-0 text-center text-sm first:rounded-l-full last:rounded-r-full has-[[data-selected]]:bg-primary/15 has-[[data-selection-start]]:rounded-l-full has-[[data-selection-end]]:rounded-r-full"
                >
                  <RangeCalendarCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="inline-flex size-10 items-center justify-center rounded-full text-sm font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring not-data-[selected]:hover:bg-primary/10 data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-60 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[unavailable]:text-muted-foreground data-[unavailable]:line-through data-[today]:not-data-[selection-start]:not-data-[selection-end]:bg-primary/25 data-[selection-end]:bg-primary data-[selection-start]:bg-primary data-[selection-end]:font-semibold data-[selection-start]:font-semibold data-[selection-end]:text-primary-foreground data-[selection-start]:text-primary-foreground"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendarRoot>
      </PopoverContent>
    </Popover>

    <Button
      variant="ghost"
      size="icon"
      class="size-9 shrink-0 rounded-full text-muted-foreground"
      aria-label="Rentang berikutnya"
      @click="shift(1)"
    >
      <PhCaretRight weight="bold" class="size-4" />
    </Button>
  </div>
</template>
