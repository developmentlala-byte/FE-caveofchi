<!--
  Halaman Dashboard: hanya menyusun komponen dan mengatur layout.
  Komponen dashboard diimpor eksplisit dari folder components.

  Layout responsif:
    HP (<640px)    1 kolom, semua card bertumpuk
    Tablet (sm/md) KPI 2 kolom, tabel event bisa digeser horizontal
    Laptop (lg)    KPI 5 kolom; tren 2/3 + perhatian 1/3; event 2/3 + sesi 1/3;
                   heatmap+studio dan peserta+keuangan berdampingan

  Data dan filter diambil dari endpoint dashboard backend.
-->
<script setup lang="ts">
import type { DateRange } from "reka-ui";
import {
  DateFormatter,
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
} from "@internationalized/date";
import {
  computed,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import DashboardAttentionList from "./components/AttentionList.vue";
import DashboardBookingTrend from "./components/BookingTrend.vue";
import DashboardBusyHeatmap from "./components/BusyHeatmap.vue";
import DashboardDefinitions from "./components/Definitions.vue";
import DashboardErrorState from "./components/ErrorState.vue";
import DashboardEventPerformance from "./components/EventPerformance.vue";
import DashboardFilterBar from "./components/FilterBar.vue";
import DashboardFinanceSummary from "./components/FinanceSummary.vue";
import DashboardKpiCards from "./components/KpiCards.vue";
import DashboardParticipants from "./components/Participants.vue";
import DashboardStudioUtilization from "./components/StudioUtilization.vue";
import DashboardUpcomingSessions from "./components/UpcomingSessions.vue";
import SkeletonAttention from "./components/skeleton/AttentionListSkeleton.vue";
import SkeletonTrend from "./components/skeleton/BookingTrendSkeleton.vue";
import SkeletonHeatmap from "./components/skeleton/BusyHeatmapSkeleton.vue";
import SkeletonEvents from "./components/skeleton/EventPerformanceSkeleton.vue";
import SkeletonFinance from "./components/skeleton/FinanceSummarySkeleton.vue";
import SkeletonKpi from "./components/skeleton/KpiCardsSkeleton.vue";
import SkeletonParticipants from "./components/skeleton/ParticipantsSkeleton.vue";
import SkeletonStudios from "./components/skeleton/StudioUtilizationSkeleton.vue";
import SkeletonUpcoming from "./components/skeleton/UpcomingSessionsSkeleton.vue";
import type {
  DashboardApiEnvelope,
  DashboardData,
} from "./types/dashboard.types";
import { useApiQuery } from "~/composables/useApiQuery";

definePageMeta({ layout: "dashboard" });
useHead({ title: "Dashboard" });

const tz = getLocalTimeZone();

// Default: 28 hari terakhir, berakhir kemarin.
// shallowRef: objek tanggal tidak perlu dibungkus proxy reactive yang dalam.
const now = today(tz);
const range = shallowRef<DateRange>({
  start: startOfMonth(now),
  end: endOfMonth(now),
});

const filters = reactive({
  studio: "all",
  event: "all",
  status: "paid",
});

const requestFilters = computed(() => ({
  start_date: range.value.start?.toString() ?? "",
  end_date: range.value.end?.toString() ?? "",
  ...(filters.studio !== "all" ? { studio_id: Number(filters.studio) } : {}),
  ...(filters.event !== "all" ? { event_id: Number(filters.event) } : {}),
  status: filters.status,
}));

const dashboardQuery = useApiQuery<DashboardApiEnvelope<DashboardData>>({
  queryKey: computed(() => ["dashboard", requestFilters.value]),
  url: "/master/dashboard",
  method: "GET",
  params: requestFilters,
  abortOnCancel: false,
  options: {
    placeholderData: (previousData) => previousData,
    enabled: computed(
      () =>
        import.meta.client &&
        Boolean(range.value.start && range.value.end),
    ),
  },
});

const dashboard = computed(() => dashboardQuery.data.value?.data);
const refreshing = computed(
  () => dashboardQuery.isFetching.value && Boolean(dashboard.value),
);

const dim = ref(false);
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

watch(refreshing, (isRefreshing) => {
  if (refreshTimer) clearTimeout(refreshTimer);
  if (isRefreshing) {
    refreshTimer = setTimeout(() => {
      dim.value = true;
    }, 150);
  } else {
    dim.value = false;
    refreshTimer = undefined;
  }
});

onBeforeUnmount(() => {
  if (refreshTimer) clearTimeout(refreshTimer);
});

const liveText = computed(() => {
  if (dashboardQuery.isError.value && !dashboard.value)
    return "Data dashboard gagal dimuat.";
  if (dashboardQuery.isPending.value && !dashboard.value)
    return "Memuat data dashboard…";
  if (refreshing.value) return "Memperbarui data dashboard…";
  return "";
});

// Teks ringkasan di header mengikuti rentang yang dipilih.
const fmt = new DateFormatter("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const summary = computed(() => {
  const { start, end } = range.value;
  if (!start || !end) return "Pilih rentang tanggal.";
  const days =
    Math.round(
      (end.toDate(tz).getTime() - start.toDate(tz).getTime()) /
        (24 * 60 * 60 * 1000),
    ) + 1;
  return `${fmt.format(start.toDate(tz))} – ${fmt.format(end.toDate(tz))} (${days} hari) · dibandingkan ${days} hari sebelumnya`;
});

function exportReport() {
  const data = dashboard.value;
  if (!data) return;

  const rows: unknown[][] = [
    ["Jenis data", "Nama", "Nilai", "Keterangan"],
    ...data.kpis.map((item) => [
      "Ringkasan",
      item.label,
      item.value,
      item.note,
    ]),
    ...data.event_performance.map((item) => [
      "Performa event",
      item.name,
      item.revenue,
      `${item.sessions} sesi, ${item.bookings} peserta dari kapasitas ${item.capacity}`,
    ]),
    ...data.upcoming.sessions.map((item) => [
      "Sesi mendatang",
      item.event,
      item.when,
      `${item.studio}, ${item.filled}/${item.quota} peserta`,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard-${requestFilters.value.start_date}-${requestFilters.value.end_date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="mx-auto flex w-full flex-col gap-4 p-4 sm:p-6 lg:gap-5 lg:p-8">
    <header
      class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
    >
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-sm text-muted-foreground">{{ summary }}</p>
      </div>
      <DashboardFilterBar
        v-model:range="range"
        v-model:studio="filters.studio"
        v-model:event="filters.event"
        v-model:status="filters.status"
        :studios="dashboard?.filters.studios ?? []"
        :events="dashboard?.filters.events ?? []"
        @export="exportReport"
      />
    </header>

    <p class="sr-only" role="status" aria-live="polite">{{ liveText }}</p>

    <DashboardErrorState
      v-if="dashboardQuery.isError.value && !dashboard"
      @retry="dashboardQuery.refetch()"
    />

    <div
      v-else
      class="flex flex-col gap-4 transition-opacity duration-200 motion-reduce:transition-none lg:gap-5"
      :class="dim && 'pointer-events-none opacity-60'"
      :aria-busy="dashboardQuery.isFetching.value"
    >
      <DashboardErrorState
        v-if="dashboardQuery.isError.value && dashboard"
        compact
        @retry="dashboardQuery.refetch()"
      />

      <template v-if="dashboard">
        <DashboardKpiCards :data="dashboard.kpis" />
      </template>
      <SkeletonKpi v-else />

      <section class="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <DashboardBookingTrend
          v-if="dashboard"
          class="lg:col-span-2"
          :data="dashboard.trend"
        />
        <SkeletonTrend v-else class="lg:col-span-2" />
        <DashboardAttentionList
          v-if="dashboard"
          :data="dashboard.attention"
        />
        <SkeletonAttention v-else />
      </section>

      <section class="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <DashboardEventPerformance
          v-if="dashboard"
          class="lg:col-span-2"
          :data="dashboard.event_performance"
        />
        <SkeletonEvents v-else class="lg:col-span-2" />
        <DashboardUpcomingSessions v-if="dashboard" :data="dashboard.upcoming" />
        <SkeletonUpcoming v-else />
      </section>

      <section class="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <DashboardBusyHeatmap v-if="dashboard" :data="dashboard.heatmap" />
        <SkeletonHeatmap v-else />
        <DashboardStudioUtilization
          v-if="dashboard"
          :data="dashboard.studio_utilization"
        />
        <SkeletonStudios v-else />
      </section>

      <section class="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <DashboardParticipants
          v-if="dashboard"
          :data="dashboard.participants"
        />
        <SkeletonParticipants v-else />
        <DashboardFinanceSummary v-if="dashboard" :data="dashboard.finance" />
        <SkeletonFinance v-else />
      </section>

      <DashboardDefinitions />
    </div>
  </div>
</template>
