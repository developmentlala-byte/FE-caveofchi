<script setup lang="ts">
import { computed, ref } from "vue";
import { formatNumber } from "../utils/format";
import DashboardCardShell from "./CardShell.vue";
import DashboardToneBadge from "./ToneBadge.vue";

interface BookingTrend {
  daily: number[];
  peak: { label: string; value: number };
  weeks: {
    label: string;
    bookings: number;
    revenue: number;
    change?: number;
  }[];
  stats: { label: string; value: number; unit: string }[];
  insight: string;
}

const props = defineProps<{ data: BookingTrend }>();

const trend = computed(() => props.data);

const W = 560;
const H = 200;
const PAD = 8;

const count = computed(() => trend.value.daily.length);
const total = computed(() => trend.value.daily.reduce((s, v) => s + v, 0));
const average = computed(() =>
  Math.round(total.value / Math.max(1, count.value)),
);
const yMax = computed(() =>
  Math.max(30, Math.ceil(Math.max(0, ...trend.value.daily) / 30) * 30),
);
const yOf = (v: number) => PAD + (H - PAD * 2) * (1 - v / yMax.value);

const points = computed(() =>
  trend.value.daily.map((v, i) => ({
    x: ((i + 0.5) * W) / count.value,
    y: yOf(v),
  })),
);
const linePath = computed(() =>
  points.value
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" "),
);
const areaPath = computed(() => {
  const p = points.value;
  return p.length
    ? `${linePath.value} L${p[p.length - 1]!.x.toFixed(1)} ${H - PAD} L${p[0]!.x.toFixed(1)} ${H - PAD} Z`
    : "";
});
const ticks = computed(() =>
  [0, 1, 2, 3].map((i) => {
    const value = Math.round((yMax.value / 3) * i);
    return { value, y: yOf(value), top: (yOf(value) / H) * 100 };
  }),
);

// Garis pemisah antar minggu + label tanggal awal minggu di sumbu X.
const weekCount = computed(() => Math.max(trend.value.weeks.length, 1));
const weekDividers = computed(() =>
  Array.from(
    { length: weekCount.value - 1 },
    (_, i) => ((i + 1) * W) / weekCount.value,
  ),
);
const weekColumns = computed(
  () => `repeat(${weekCount.value}, minmax(0, 1fr))`,
);
const perWeek = computed(() => count.value / weekCount.value);
const weekOf = (index: number) =>
  trend.value.weeks[
    Math.min(Math.floor(index / perWeek.value), weekCount.value - 1)
  ];

// Interaksi: titik aktif default-nya puncak, berpindah mengikuti kursor.
const peakIndex = computed(() =>
  trend.value.daily.indexOf(Math.max(...trend.value.daily)),
);
const hoverIndex = ref<number | null>(null);
const activeIndex = computed(() => hoverIndex.value ?? peakIndex.value);
const onMove = (event: MouseEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (!rect.width) return;
  const ratio = (event.clientX - rect.left) / rect.width;
  hoverIndex.value = Math.min(
    Math.max(Math.floor(ratio * count.value), 0),
    count.value - 1,
  );
};
const onLeave = () => {
  hoverIndex.value = null;
};

const active = computed(() => {
  const i = activeIndex.value;
  const p = points.value[i];
  if (!p) return null;
  const left = (p.x / W) * 100;
  const week = weekOf(i);
  return {
    left,
    top: (p.y / H) * 100,
    shift: left < 20 ? -12 : left > 80 ? -88 : -50,
    value: trend.value.daily[i] ?? 0,
    caption:
      hoverIndex.value === null
        ? `Puncak · ${trend.value.peak.label}`
        : week
          ? `Minggu ${week.label}`
          : "",
  };
});

const label = computed(
  () =>
    `Grafik booking harian, puncak ${trend.value.peak.value} pada ${trend.value.peak.label}.`,
);
</script>

<template>
  <DashboardCardShell
    title="Tren booking"
    :description="`${formatNumber(total)} booking lunas · rata-rata ${average} per hari`"
  >
    <template #action>
      <DashboardToneBadge tone="brand"
        >Puncak {{ trend.peak.value }} ·
        {{ trend.peak.label }}</DashboardToneBadge
      >
    </template>

    <div class="flex flex-col gap-2">
      <div class="flex h-[280px] gap-2 pt-10">
        <div
          class="relative w-7 shrink-0 text-right text-[11px] text-muted-foreground"
          aria-hidden="true"
        >
          <span
            v-for="t in ticks"
            :key="t.value"
            class="absolute right-0 -translate-y-1/2 leading-none tabular-nums"
            :style="{ top: `${t.top}%` }"
            >{{ t.value }}</span
          >
        </div>

        <div
          class="relative min-w-0 flex-1 cursor-crosshair"
          @mousemove="onMove"
          @mouseleave="onLeave"
        >
          <svg
            class="absolute inset-0 size-full"
            :viewBox="`0 0 ${W} ${H}`"
            preserveAspectRatio="none"
            role="img"
            :aria-label="label"
          >
            <line
              v-for="t in ticks"
              :key="t.value"
              x1="0"
              :x2="W"
              :y1="t.y"
              :y2="t.y"
              class="stroke-border"
              stroke-dasharray="3 4"
              vector-effect="non-scaling-stroke"
            />
            <line
              v-for="x in weekDividers"
              :key="x"
              :x1="x"
              :x2="x"
              y1="0"
              :y2="H"
              class="stroke-border"
              vector-effect="non-scaling-stroke"
            />
            <path :d="areaPath" class="fill-primary/10" />
            <path
              :d="linePath"
              fill="none"
              class="stroke-primary"
              stroke-width="2"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <p
            v-if="total === 0"
            class="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground"
          >
            Belum ada booking lunas pada periode ini.
          </p>

          <template v-if="active">
            <span
              class="pointer-events-none absolute inset-y-0 w-px bg-primary/30"
              :style="{ left: `${active.left}%` }"
              aria-hidden="true"
            />
            <span
              class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
              :style="{ left: `${active.left}%`, top: `${active.top}%` }"
              aria-hidden="true"
            />
            <div
              class="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md"
              :style="{
                left: `${active.left}%`,
                top: `${active.top}%`,
                transform: `translate(${active.shift}%, calc(-100% - 14px))`,
              }"
            >
              <p class="text-sm font-semibold tabular-nums">
                {{ active.value }} booking
              </p>
              <p class="text-xs text-muted-foreground">{{ active.caption }}</p>
            </div>
          </template>
        </div>
      </div>

      <div
        class="ml-9 grid text-[11px] text-muted-foreground"
        :style="{ gridTemplateColumns: weekColumns }"
      >
        <span v-for="w in trend.weeks" :key="w.label" class="truncate pl-1">{{
          w.label
        }}</span>
      </div>
    </div>

    <dl
      v-if="trend.stats.length"
      class="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-3"
    >
      <div
        v-for="s in trend.stats"
        :key="s.label"
        class="flex flex-col gap-0.5"
      >
        <dt class="text-xs text-muted-foreground">{{ s.label }}</dt>
        <dd class="text-sm">
          <span class="font-semibold tabular-nums">{{
            formatNumber(s.value)
          }}</span>
          <span class="text-muted-foreground"> {{ s.unit }}</span>
        </dd>
      </div>
    </dl>

    <p
      class="mt-5 rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
    >
      <span class="font-medium text-foreground">Insight · </span
      >{{ trend.insight }}
    </p>
  </DashboardCardShell>
</template>
