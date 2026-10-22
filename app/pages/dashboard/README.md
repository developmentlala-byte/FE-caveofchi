# Dashboard Mahalu Studio (Vue/Nuxt)

Salin folder `components/`, `pages/`, dan `utils/` ke project Nuxt kamu.

```
components/dashboard/
  KpiCards.vue            -> <DashboardKpiCards />
  BookingTrend.vue        -> <DashboardBookingTrend />
  AttentionList.vue       -> <DashboardAttentionList />
  EventPerformance.vue    -> <DashboardEventPerformance />
  UpcomingSessions.vue    -> <DashboardUpcomingSessions />
  StudioUtilization.vue   -> <DashboardStudioUtilization />
  BusyHeatmap.vue         -> <DashboardBusyHeatmap />
  Participants.vue        -> <DashboardParticipants />
  FinanceSummary.vue      -> <DashboardFinanceSummary />
  Definitions.vue         -> <DashboardDefinitions />
  FilterBar.vue           -> <DashboardFilterBar />
  ToneBadge.vue           -> <DashboardToneBadge />   (atom: badge berwarna)
  MeterBar.vue            -> <DashboardMeterBar />    (atom: bar persentase)
pages/dashboard.vue       -> halaman yang menyatukan semuanya
utils/format.ts           -> formatNumber, formatRupiah, formatRupiahCompact, dll.
```

## Syarat
- Nuxt 3.9+ (memakai `defineModel`), Tailwind v4 + CSS tema HeroUI kamu.
- shadcn-vue terpasang: `card`, `badge`, `button`
  (`npx shadcn-vue@latest add card badge button`).
- Alias `@/` dan `~/` (bawaan Nuxt).

## Data dan filter
Dashboard mengambil agregat aktual dari endpoint `GET /api/master/dashboard`.
Filter tanggal, studio, event, dan status booking dikirim bersama request dan
menjadi bagian dari query key supaya setiap kombinasi filter memiliki cache
tersendiri. Komponen ringkasan menerima data dari endpoint dan tidak memakai
angka contoh sebagai fallback. Refund ditandai tidak tersedia karena backend
saat ini belum menyimpan data refund.

Saat pemuatan pertama, tiap kartu memakai skeleton yang mengikuti struktur
kontennya. Saat filter berubah, data sebelumnya tetap terlihat selama request
berjalan; jika pemuatan pertama gagal, halaman menampilkan status error dan
tombol untuk mencoba lagi.
