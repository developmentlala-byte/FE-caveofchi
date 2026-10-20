<script setup lang="ts">
import { computed } from "vue";
import type { DateRange } from "reka-ui";
import {
  PhCalendarBlank,
  PhCalendarCheck,
  PhClock,
  PhDotsThree,
  PhLockSimple,
  PhNote,
  PhPencilSimple,
  PhPlus,
  PhUsers,
  PhX,
} from "@phosphor-icons/vue";
import type {
  Event as EventModel,
  EventImage,
  EventSession,
  EventSessionStatus,
  EventStatus,
  Studio,
} from "../types/event.types";
import IconTip from "~/components/IconTip.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import DateRangePicker from "~/components/DateRangePicker.vue";
import ImageDropzone from "~/components/ImageDropzone.vue";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  event: EventModel | null;
  sessions: EventSession[];
  publishableSessions: EventSession[];
  sessionDateRange: DateRange;
  sessionsLoading: boolean;
  sessionsError: boolean;
  images: EventImage[];
  imagesLoading: boolean;
  imagesError: boolean;
  studios: Studio[];
  studiosError: boolean;
  loading: boolean;
}>();
const emit = defineEmits<{
  editEvent: [event: EventModel];
  createSession: [];
  editSession: [session: EventSession];
  publish: [event: EventModel];
  toggleAvailability: [event: EventModel];
  archive: [event: EventModel];
  closeSession: [session: EventSession];
  cancelSession: [session: EventSession];
  deleteSession: [session: EventSession];
  uploadImages: [images: File[]];
  deleteImage: [image: EventImage];
  refreshSessions: [];
  updateSessionDateRange: [range: DateRange];
  refreshImages: [];
  refreshStudios: [];
}>();
const sessionDateRangeModel = computed({
  get: () => props.sessionDateRange,
  set: (range: DateRange) => emit("updateSessionDateRange", range),
});

/* ---------- Status event ---------- */
const EVENT_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Terbit",
  closed: "Ditutup",
  archived: "Diarsipkan",
};
const EVENT_DOT: Record<EventStatus, string> = {
  draft: "bg-amber-500",
  published: "bg-emerald-500",
  closed: "bg-destructive",
  archived: "bg-muted-foreground/50",
};

/* ---------- Status sesi ---------- */
const SESSION_SHORT: Record<EventSessionStatus, string> = {
  draft: "Draft",
  open: "Dibuka",
  closed: "Ditutup",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};
const SESSION_DOT: Record<EventSessionStatus, string> = {
  draft: "bg-amber-500",
  open: "bg-amber-500",
  closed: "bg-muted-foreground/50",
  cancelled: "bg-destructive",
  completed: "bg-muted-foreground/50",
};

// Sesi yang sudah bisa dibeli selalu "Dijual" dengan titik hijau.
const sessionLabel = (session: EventSession) =>
  session.is_bookable ? "Dijual" : SESSION_SHORT[session.status];
const sessionDot = (session: EventSession) =>
  session.is_bookable ? "bg-emerald-500" : SESSION_DOT[session.status];
const statusTip = (session: EventSession) =>
  session.is_bookable
    ? "Siap dibeli: peserta sudah bisa memesan sesi ini."
    : "Belum bisa dibeli oleh peserta.";

/* ---------- Turunan data ---------- */
const canPublish = computed(
  () =>
    props.event?.status === "draft" &&
    props.publishableSessions.some(
      (session) =>
        session.status === "draft" &&
        session.available_slots > 0 &&
        new Date(session.starts_at).getTime() > Date.now() &&
        session.studio?.status === "active" &&
        session.quota <= session.studio.max_capacity,
    ),
);

const openCount = computed(
  () => props.sessions.filter((session) => session.is_bookable).length,
);

const sectionHint = computed(() => {
  if (!props.event || props.sessionsLoading || props.sessionsError) return "";
  if (props.event.status === "closed")
    return "Event ditutup secara manual. Peserta tidak dapat melakukan booking sampai event dibuka kembali.";
  if (props.studiosError) return "";
  if (props.studios.length === 0)
    return "Tambahkan studio aktif sebelum menyiapkan sesi.";
  if (props.event.status === "draft" && !canPublish.value)
    return "Event bisa diterbitkan setelah ada sesi draft yang valid: jadwal mendatang, studio aktif, dan kuota sesuai kapasitas.";
  if (props.event.status !== "published")
    return "Terbitkan event terlebih dahulu untuk membuka penjualan sesi.";
  return "";
});

/* ---------- Format tanggal ---------- */
const TZ = "Asia/Jakarta";
const dateOnly = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: TZ,
});
const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TZ,
});
const timeOnly = new Intl.DateTimeFormat("id-ID", {
  timeStyle: "short",
  timeZone: TZ,
});

// Tanggal dan jam dipisah supaya tidak terpotong di tengah rentang.
const sessionDate = (session: EventSession) => {
  const a = new Date(session.starts_at);
  const b = new Date(session.ends_at);
  return dateOnly.format(a) === dateOnly.format(b)
    ? dateOnly.format(a)
    : dateOnly.formatRange(a, b);
};
const sessionTime = (session: EventSession) =>
  `${timeOnly.format(new Date(session.starts_at))} – ${timeOnly.format(new Date(session.ends_at))}`;

// Ringkas untuk kartu; jam persisnya ada di tooltip.
const registrationShort = (session: EventSession) => {
  const from = session.registration_opens_at
    ? new Date(session.registration_opens_at)
    : null;
  const to = session.registration_closes_at
    ? new Date(session.registration_closes_at)
    : null;
  if (from && to) return dateOnly.formatRange(from, to);
  if (from) return `mulai ${dateOnly.format(from)}`;
  if (to) return `sampai ${dateOnly.format(to)}`;
  return "";
};
const registrationFull = (session: EventSession) => {
  const from = session.registration_opens_at
    ? dateTime.format(new Date(session.registration_opens_at))
    : "langsung";
  const to = session.registration_closes_at
    ? dateTime.format(new Date(session.registration_closes_at))
    : "tanpa batas akhir";
  return `Dibuka: ${from} · Ditutup: ${to}`;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

/* ---------- Helper kartu sesi ---------- */
const fillPercent = (session: EventSession) =>
  session.quota > 0
    ? Math.min(100, Math.round((session.reserved_count / session.quota) * 100))
    : 0;

const slotText = (session: EventSession) =>
  `${session.reserved_count} dari ${session.quota} slot terpesan · ${session.available_slots} tersisa`;

const hasMenu = (session: EventSession) =>
  ["draft", "open", "closed"].includes(session.status);

const canCloseSales = (session: EventSession) =>
  session.is_bookable && ["draft", "open"].includes(session.status);

const ICON_BTN =
  "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 text-foreground sm:max-w-4xl"
    >
      <template v-if="!event">
        <DialogHeader class="p-6 text-left">
          <DialogTitle>Detail event</DialogTitle>
          <DialogDescription>Tidak ada event yang dipilih.</DialogDescription>
        </DialogHeader>
      </template>

      <template v-else>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pt-12 pb-6">
          <div class="grid gap-7">
            <!-- Ringkasan -->
            <section class="grid gap-5">
              <div
                class="aspect-[16/7] overflow-hidden rounded-xl border bg-muted"
              >
                <img
                  v-if="event.cover_image_url"
                  :src="event.cover_image_url"
                  :alt="`Cover ${event.name}`"
                  class="size-full object-cover"
                />
                <div
                  v-else
                  class="flex size-full items-center justify-center text-4xl font-semibold text-muted-foreground/60"
                  aria-hidden="true"
                >
                  {{ event.name.slice(0, 2).toUpperCase() }}
                </div>
              </div>

              <DialogHeader class="gap-1.5 p-0 text-left">
                <div class="flex items-start justify-between gap-3">
                  <DialogTitle class="text-xl leading-tight font-semibold">
                    {{ event.name }}
                  </DialogTitle>
                  <Badge
                    variant="secondary"
                    class="shrink-0 gap-1.5 font-normal"
                  >
                    <span
                      class="size-1.5 rounded-full"
                      :class="EVENT_DOT[event.status]"
                      aria-hidden="true"
                    />
                    {{ EVENT_LABEL[event.status] }}
                  </Badge>
                </div>
                <DialogDescription>
                  {{
                    event.short_description || "Belum ada deskripsi singkat."
                  }}
                </DialogDescription>
              </DialogHeader>

              <dl class="divide-y rounded-xl border text-sm">
                <div class="flex items-center justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Kode</dt>
                  <dd class="font-medium">{{ event.code }}</dd>
                </div>
                <div class="flex items-center justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Slug</dt>
                  <dd class="min-w-0 truncate font-medium" :title="event.slug">
                    {{ event.slug }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-4 px-4 py-3">
                  <dt class="text-muted-foreground">Sesi</dt>
                  <dd class="font-medium tabular-nums">
                    {{ sessions.length }} sesi · {{ openCount }} dijual
                  </dd>
                </div>
              </dl>
            </section>

            <!-- Sesi -->
            <section class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-medium">Sesi</h3>
                <Button
                  size="sm"
                  variant="outline"
                  class="gap-1.5"
                  :disabled="loading || studios.length === 0"
                  @click="emit('createSession')"
                >
                  <PhPlus :size="14" />
                  Tambah sesi
                </Button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <DateRangePicker
                  v-model="sessionDateRangeModel"
                  placeholder="Filter tanggal sesi"
                  class="h-10"
                />
                <Button
                  v-if="sessionDateRange.start || sessionDateRange.end"
                  type="button"
                  size="sm"
                  variant="ghost"
                  class="gap-1.5"
                  @click="
                    emit('updateSessionDateRange', {
                      start: undefined,
                      end: undefined,
                    })
                  "
                >
                  <PhX :size="14" />
                  Hapus filter
                </Button>
              </div>
              <p
                v-if="sessionDateRange.start && sessionDateRange.end"
                class="text-xs text-muted-foreground"
              >
                Menampilkan sesi berdasarkan tanggal mulai.
              </p>

              <p
                v-if="studiosError"
                class="text-sm text-destructive"
                role="alert"
              >
                Studio gagal dimuat.
                <Button
                  variant="link"
                  class="h-auto p-0 text-destructive"
                  @click="emit('refreshStudios')"
                >
                  Coba lagi
                </Button>
              </p>
              <p v-else-if="sectionHint" class="text-xs text-muted-foreground">
                {{ sectionHint }}
              </p>

              <div
                v-if="sessionsLoading"
                class="grid gap-3 sm:grid-cols-2"
                aria-label="Memuat sesi"
              >
                <div
                  v-for="item in 2"
                  :key="item"
                  class="h-48 animate-pulse rounded-xl bg-muted"
                />
              </div>

              <div
                v-else-if="sessionsError"
                class="rounded-xl border border-dashed p-6 text-center"
              >
                <p class="text-sm text-muted-foreground">
                  Sesi tidak dapat dimuat.
                </p>
                <Button
                  variant="link"
                  class="mt-1 h-auto p-0"
                  @click="emit('refreshSessions')"
                >
                  Coba lagi
                </Button>
              </div>

              <div
                v-else-if="sessions.length === 0 && event.sessions_count === 0"
                class="grid gap-3 rounded-xl border border-dashed bg-muted/20 p-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div class="grid gap-1">
                  <p class="text-sm font-medium">
                    Event ini belum memiliki sesi
                  </p>
                  <p class="text-sm text-muted-foreground">
                    Detail event tetap tersimpan. Agar peserta dapat memilih
                    jadwal dan mendaftar, tambahkan sesi dengan studio, waktu,
                    harga, dan kuota.
                  </p>
                  <p
                    v-if="studios.length === 0 && !studiosError"
                    class="text-xs text-muted-foreground"
                  >
                    Tambahkan studio aktif terlebih dahulu untuk menyiapkan
                    sesi.
                  </p>
                </div>
                <Button
                  size="sm"
                  class="gap-1.5 sm:shrink-0"
                  :disabled="loading || studios.length === 0"
                  @click="emit('createSession')"
                >
                  <PhPlus :size="14" />
                  Tambah sesi
                </Button>
              </div>

              <p
                v-else-if="sessions.length === 0"
                class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"
              >
                Tidak ada sesi pada rentang tanggal ini. Ubah atau hapus filter
                tanggal untuk melihat sesi lainnya.
              </p>

              <TooltipProvider v-else :delay-duration="150">
                <div class="grid gap-3 sm:grid-cols-2">
                  <article
                    v-for="session in sessions"
                    :key="session.id"
                    class="flex flex-col rounded-xl border"
                  >
                    <div class="grid flex-1 content-start gap-3 p-4">
                      <!-- Studio & status -->
                      <header class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <h4 class="truncate text-sm font-medium">
                            {{
                              session.studio?.name || "Studio tidak tersedia"
                            }}
                          </h4>
                          <p
                            v-if="session.studio?.code"
                            class="truncate text-xs text-muted-foreground"
                          >
                            {{ session.studio.code }}
                          </p>
                        </div>
                        <IconTip :text="statusTip(session)">
                          <span
                            tabindex="0"
                            class="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <Badge
                              variant="secondary"
                              class="gap-1.5 font-normal"
                            >
                              <span
                                class="size-1.5 rounded-full"
                                :class="sessionDot(session)"
                                aria-hidden="true"
                              />
                              {{ sessionLabel(session) }}
                            </Badge>
                          </span>
                        </IconTip>
                      </header>

                      <!-- Jadwal -->
                      <div class="grid gap-1 text-xs">
                        <p class="flex items-center gap-1.5">
                          <PhCalendarBlank
                            :size="14"
                            class="shrink-0 text-muted-foreground"
                          />
                          {{ sessionDate(session) }}
                        </p>
                        <p
                          class="flex items-center gap-1.5 text-muted-foreground"
                        >
                          <PhClock :size="14" class="shrink-0" />
                          {{ sessionTime(session) }}
                        </p>
                        <IconTip
                          v-if="registrationShort(session)"
                          :text="registrationFull(session)"
                        >
                          <p
                            tabindex="0"
                            class="flex w-fit max-w-full items-center gap-1.5 rounded text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <PhCalendarCheck :size="14" class="shrink-0" />
                            <span class="truncate">
                              Pendaftaran {{ registrationShort(session) }}
                            </span>
                          </p>
                        </IconTip>
                      </div>

                      <!-- Harga & slot -->
                      <div class="grid gap-2">
                        <p class="text-base leading-none font-semibold">
                          {{ formatPrice(session.price) }}
                          <span
                            class="text-xs font-normal text-muted-foreground"
                          >
                            / peserta
                          </span>
                        </p>
                        <IconTip :text="slotText(session)">
                          <div
                            tabindex="0"
                            class="flex items-center gap-2 rounded text-xs text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            :aria-label="slotText(session)"
                          >
                            <div
                              class="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                              role="progressbar"
                              aria-label="Slot terpesan"
                              :aria-valuenow="session.reserved_count"
                              aria-valuemin="0"
                              :aria-valuemax="session.quota"
                            >
                              <div
                                class="h-full rounded-full bg-primary transition-all"
                                :style="{ width: `${fillPercent(session)}%` }"
                              />
                            </div>
                            <span
                              class="flex shrink-0 items-center gap-1 tabular-nums"
                            >
                              <PhUsers :size="14" />
                              {{ session.reserved_count }}/{{ session.quota }}
                            </span>
                          </div>
                        </IconTip>
                      </div>
                    </div>

                    <!-- Catatan (kiri) dan aksi (kanan) -->
                    <footer
                      class="flex items-center justify-between gap-1 border-t px-2 py-1.5"
                    >
                      <div class="flex items-center">
                        <IconTip v-if="session.notes" text="Catatan internal">
                          <button
                            type="button"
                            :class="ICON_BTN"
                            aria-label="Lihat catatan internal"
                          >
                            <PhNote :size="18" />
                          </button>
                          <template #content>
                            <p class="font-medium">Catatan internal</p>
                            <p class="mt-0.5 break-words whitespace-pre-wrap">
                              {{ session.notes }}
                            </p>
                          </template>
                        </IconTip>
                      </div>

                      <div class="flex items-center">
                        <IconTip
                          v-if="canCloseSales(session)"
                          text="Tutup penjualan"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            class="size-8"
                            aria-label="Tutup penjualan"
                            :disabled="loading"
                            @click="emit('closeSession', session)"
                          >
                            <PhLockSimple :size="18" />
                          </Button>
                        </IconTip>

                        <template v-if="hasMenu(session)">
                          <IconTip text="Edit sesi">
                            <Button
                              size="icon"
                              variant="ghost"
                              class="size-8"
                              aria-label="Edit sesi"
                              :disabled="loading"
                              @click="emit('editSession', session)"
                            >
                              <PhPencilSimple :size="18" />
                            </Button>
                          </IconTip>

                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <Button
                                size="icon"
                                variant="ghost"
                                class="size-8"
                                aria-label="Aksi lainnya"
                                :disabled="loading"
                              >
                                <PhDotsThree :size="18" weight="bold" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                :disabled="session.reserved_count > 0"
                                :title="
                                  session.reserved_count > 0
                                    ? 'Sudah ada peserta yang memesan'
                                    : undefined
                                "
                                @select="emit('cancelSession', session)"
                              >
                                Batalkan sesi
                              </DropdownMenuItem>
                              <template v-if="session.status === 'draft'">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  class="text-destructive focus:text-destructive"
                                  :disabled="session.reserved_count > 0"
                                  :title="
                                    session.reserved_count > 0
                                      ? 'Sudah ada peserta yang memesan'
                                      : undefined
                                  "
                                  @select="emit('deleteSession', session)"
                                >
                                  Hapus
                                </DropdownMenuItem>
                              </template>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </template>
                      </div>
                    </footer>
                  </article>
                </div>
              </TooltipProvider>
            </section>

            <!-- Galeri -->
            <section class="grid gap-3">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium">Galeri</h3>
                <span class="text-xs text-muted-foreground tabular-nums">
                  {{ imagesError ? "–" : images.length }} foto
                </span>
              </div>
              <ImageDropzone
                :disabled="loading"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png,.webp"
                :allowed-extensions="['jpg', 'jpeg', 'png', 'webp']"
                @files="emit('uploadImages', $event)"
              />

              <div
                v-if="imagesLoading"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4"
                aria-label="Memuat galeri"
              >
                <div
                  v-for="item in 4"
                  :key="item"
                  class="aspect-square animate-pulse rounded-lg bg-muted"
                />
              </div>

              <div
                v-else-if="imagesError"
                class="rounded-xl border border-dashed p-6 text-center"
              >
                <p class="text-sm text-muted-foreground">
                  Galeri event tidak dapat dimuat.
                </p>
                <Button
                  variant="link"
                  class="mt-1 h-auto p-0"
                  @click="emit('refreshImages')"
                >
                  Coba lagi
                </Button>
              </div>

              <template v-else>
                <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <div
                    v-for="image in images"
                    :key="image.id"
                    class="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  >
                    <a
                      :href="image.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="block size-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <img
                        :src="image.url"
                        :alt="image.alt_text || `Galeri ${event.name}`"
                        class="size-full object-cover"
                        loading="lazy"
                      />
                    </a>
                    <button
                      type="button"
                      :aria-label="`Hapus gambar ${image.alt_text || event.name}`"
                      :disabled="loading"
                      class="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-opacity hover:bg-background focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                      @click="emit('deleteImage', image)"
                    >
                      <PhX :size="12" />
                    </button>
                  </div>
                </div>
                <p
                  v-if="images.length === 0"
                  class="text-xs text-muted-foreground"
                >
                  Belum ada foto galeri.
                </p>
              </template>
            </section>
          </div>
        </div>

        <!-- Footer aksi -->
        <div class="flex gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            class="flex-1 gap-2"
            :disabled="loading"
            @click="emit('editEvent', event)"
          >
            <PhPencilSimple :size="16" />
            Edit event
          </Button>
          <Button
            v-if="event.status === 'published' || event.status === 'closed'"
            variant="outline"
            class="flex-1 gap-2"
            :disabled="loading"
            @click="emit('toggleAvailability', event)"
          >
            <PhLockSimple :size="16" />
            {{ event.status === "published" ? "Tutup event" : "Buka event" }}
          </Button>
          <Button
            v-if="canPublish"
            class="flex-1"
            :disabled="loading"
            @click="emit('publish', event)"
          >
            Terbitkan event
          </Button>
          <Button
            v-if="event.status === 'published' || event.status === 'closed'"
            variant="outline"
            class="flex-1"
            :disabled="loading"
            @click="emit('archive', event)"
          >
            Arsipkan event
          </Button>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
