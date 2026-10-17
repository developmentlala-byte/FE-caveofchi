<script setup lang="ts">
import { ref, watch } from "vue";
import { PhCalendarPlus } from "@phosphor-icons/vue";
import type {
  Event,
  EventFormValues,
  EventSessionFormValues,
  Studio,
} from "../types/event.types";
import EventSessionFields from "./EventSessionFields.vue";
import CoverImageField from "~/components/CoverImageField.vue";
import FieldHint from "~/components/FieldHint.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  event: Event | null;
  loading: boolean;
  studios: Studio[];
  studiosLoading: boolean;
  studiosError: boolean;
}>();
const emit = defineEmits<{
  submit: [values: EventFormValues];
  refreshStudios: [];
}>();

const emptySession = (): EventSessionFormValues => ({
  studio_id: null,
  starts_at: "",
  ends_at: "",
  registration_opens_at: "",
  registration_closes_at: "",
  quota: 1,
  price: 0,
  notes: "",
});

const emptyForm = (): EventFormValues => ({
  name: "",
  short_description: "",
  description: "",
  terms: "",
  cover_image: null,
  first_session: emptySession(),
});

const form = ref<EventFormValues>(emptyForm());
const includeFirstSession = ref(true);

watch(
  () => [open.value, props.event] as const,
  ([isOpen, event]) => {
    if (!isOpen) return;
    form.value = event
      ? {
          name: event.name,
          short_description: event.short_description ?? "",
          description: event.description ?? "",
          terms: event.terms ?? "",
          cover_image: null,
          first_session: null,
        }
      : emptyForm();
    includeFirstSession.value = !event;
  },
);

watch(
  () => [open.value, props.studios] as const,
  ([isOpen, studios]) => {
    if (
      isOpen &&
      !props.event &&
      form.value.first_session?.studio_id === null &&
      studios.length > 0
    ) {
      form.value.first_session.studio_id = studios[0].id;
    }
  },
  { immediate: true },
);

const submit = () =>
  emit("submit", {
    ...form.value,
    first_session: includeFirstSession.value
      ? { ...form.value.first_session! }
      : null,
  });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
    >
      <DialogHeader class="px-6 pt-6 pb-4 text-left">
        <DialogTitle>{{ event ? "Edit event" : "Tambah event" }}</DialogTitle>
        <DialogDescription>
          <template v-if="event">
            Perbarui informasi event. Sesi yang sudah ada tidak berubah.
          </template>
          <template v-else>
            Isi detail event, lalu atur sesi pertama jika sudah siap.
          </template>
        </DialogDescription>
      </DialogHeader>

      <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
        <TooltipProvider :delay-duration="150">
          <div class="min-h-0 flex-1 overflow-y-auto border-y px-6 py-5">
            <div class="grid gap-5">
              <!-- Cover -->
              <CoverImageField
                v-model="form.cover_image"
                :current-url="event?.cover_image_url"
              />

              <!-- Nama -->
              <div class="grid gap-2">
                <Label for="event-name">Nama event</Label>
                <Input
                  id="event-name"
                  v-model="form.name"
                  required
                  maxlength="150"
                  placeholder="Contoh: Workshop Fotografi"
                />
              </div>

              <!-- Deskripsi singkat -->
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <Label for="event-short-description">
                      Deskripsi singkat
                    </Label>
                    <FieldHint text="Ringkasan yang tampil di daftar event." />
                  </div>
                  <span class="text-xs text-muted-foreground tabular-nums">
                    {{ (form.short_description ?? "").length }}/250
                  </span>
                </div>
                <Input
                  id="event-short-description"
                  v-model="form.short_description"
                  maxlength="250"
                  placeholder="Ringkasan event"
                />
              </div>

              <!-- Deskripsi lengkap -->
              <div class="grid gap-2">
                <div class="flex items-center gap-1.5">
                  <Label for="event-description">Deskripsi</Label>
                  <FieldHint
                    text="Jelaskan kegiatan, target peserta, dan fasilitas."
                  />
                </div>
                <Textarea
                  id="event-description"
                  v-model="form.description"
                  rows="4"
                  class="resize-none"
                  placeholder="Informasi lengkap tentang event"
                />
              </div>

              <!-- Syarat dan ketentuan -->
              <div class="grid gap-2">
                <div class="flex items-center gap-1.5">
                  <Label for="event-terms">Syarat dan ketentuan</Label>
                  <FieldHint text="Ketentuan pendaftaran dan keikutsertaan." />
                </div>
                <Textarea
                  id="event-terms"
                  v-model="form.terms"
                  rows="3"
                  class="resize-none"
                  placeholder="Tulis syarat dan ketentuan"
                />
              </div>

              <!-- Sesi pertama (hanya saat membuat event baru) -->
              <section v-if="!event" class="rounded-xl border">
                <div class="flex items-center justify-between gap-4 p-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <PhCalendarPlus :size="20" class="shrink-0 text-primary" />
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <h3 class="text-sm font-medium">Sesi pertama</h3>
                        <FieldHint
                          text="Event akan diterbitkan dan sesi dibuka setelah jadwal, studio, harga, dan kuota berhasil disimpan. Jika pendaftaran diatur ke masa depan, slot dapat dipesan mulai waktu tersebut."
                        />
                      </div>
                      <p class="text-xs text-muted-foreground">
                        Buat sesi dan langsung buka penjualan.
                      </p>
                    </div>
                  </div>
                  <Switch
                    :model-value="includeFirstSession"
                    aria-label="Sertakan sesi pertama"
                    @update:model-value="(v) => (includeFirstSession = !!v)"
                  />
                </div>

                <div
                  v-if="includeFirstSession && form.first_session"
                  class="border-t p-4"
                >
                  <EventSessionFields
                    v-model="form.first_session"
                    :studios="studios"
                    :studios-loading="studiosLoading"
                    :studios-error="studiosError"
                    @refresh-studios="emit('refreshStudios')"
                  />
                </div>
              </section>
            </div>
          </div>
        </TooltipProvider>

        <DialogFooter class="px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            :disabled="loading"
            @click="open = false"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="
              loading ||
              (!event &&
                includeFirstSession &&
                (studiosLoading ||
                  studiosError ||
                  studios.length === 0 ||
                  form.first_session?.studio_id === null))
            "
          >
            <Spinner v-if="loading" />
            {{
              loading
                ? "Menyiapkan event dan sesi..."
                : includeFirstSession && !event
                  ? "Buat event & buka penjualan"
                  : "Simpan event"
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
