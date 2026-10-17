<script setup lang="ts">
import { computed } from "vue";
import type { EventSessionFormValues, Studio } from "../types/event.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import FieldHint from "~/components/FieldHint.vue";
import DateTimeRangeField from "~/components/DateTimeRangeField.vue";
import DateTimePickerField from "~/components/DateTimePickerField.vue";
import CurrencyInput from "~/components/CurrencyInput.vue";

const session = defineModel<EventSessionFormValues>({ required: true });
const props = withDefaults(
  defineProps<{
    studios: Studio[];
    studiosLoading?: boolean;
    studiosError?: boolean;
  }>(),
  { studiosLoading: false, studiosError: false },
);
const emit = defineEmits<{ refreshStudios: [] }>();

const studioValue = computed({
  get: () =>
    session.value.studio_id === null
      ? undefined
      : String(session.value.studio_id),
  set: (value) => {
    session.value.studio_id = value ? Number(value) : null;
  },
});

const selectedStudio = computed(() =>
  props.studios.find((studio) => studio.id === session.value.studio_id),
);

const orderError = (from: string, to: string, message: string) =>
  from && to && to <= from ? message : "";

const sessionError = computed(() =>
  orderError(
    session.value.starts_at,
    session.value.ends_at,
    "Waktu selesai harus setelah waktu mulai.",
  ),
);
const registrationError = computed(() => {
  if (
    session.value.registration_opens_at &&
    session.value.starts_at &&
    session.value.registration_opens_at > session.value.starts_at
  ) {
    return "Pendaftaran harus dibuka sebelum atau saat sesi dimulai.";
  }
  if (
    session.value.registration_closes_at &&
    session.value.starts_at &&
    session.value.registration_closes_at > session.value.starts_at
  ) {
    return "Pendaftaran harus ditutup sebelum atau saat sesi dimulai.";
  }
  return orderError(
    session.value.registration_opens_at,
    session.value.registration_closes_at,
    "Penutupan pendaftaran harus setelah pembukaan.",
  );
});

const quotaHint = computed(() =>
  selectedStudio.value
    ? `Maksimal ${selectedStudio.value.max_capacity} orang sesuai kapasitas studio.`
    : "Pilih studio untuk melihat batas kuota.",
);
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <div class="grid gap-5">
      <div class="grid gap-2">
        <div class="flex items-center gap-1.5">
          <Label for="session-studio">Studio</Label>
          <FieldHint text="Hanya studio aktif yang ditampilkan." />
        </div>
        <Select
          v-model="studioValue"
          :disabled="studiosLoading || studios.length === 0"
        >
          <SelectTrigger id="session-studio" class="w-full">
            <SelectValue
              :placeholder="
                studiosLoading ? 'Memuat studio...' : 'Pilih studio aktif'
              "
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="studio in studios"
              :key="studio.id"
              :value="String(studio.id)"
            >
              <div class="flex min-w-0 items-center gap-3 py-1">
                <img
                  v-if="studio.cover_image_url"
                  :src="studio.cover_image_url"
                  :alt="`Cover ${studio.name}`"
                  class="size-10 shrink-0 rounded-lg object-cover"
                />
                <div
                  v-else
                  aria-hidden="true"
                  class="size-10 shrink-0 rounded-lg bg-muted"
                />
                <span class="grid min-w-0">
                  <span class="truncate font-medium">{{ studio.name }}</span>
                  <span class="truncate text-xs text-muted-foreground">
                    {{ studio.code }} · kapasitas {{ studio.max_capacity }}
                  </span>
                </span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="studiosError" class="text-xs text-destructive" role="alert">
          Studio gagal dimuat.
          <Button
            type="button"
            variant="link"
            class="h-auto p-0 text-xs text-destructive"
            @click="emit('refreshStudios')"
          >
            Coba lagi
          </Button>
        </p>
        <p
          v-else-if="!studiosLoading && studios.length === 0"
          class="text-xs text-destructive"
          role="alert"
        >
          Tambahkan studio aktif sebelum membuat sesi yang bisa dijual.
        </p>
      </div>

      <!-- Jadwal sesi -->
      <div class="grid gap-2">
        <Label>Jadwal sesi</Label>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <span class="text-xs text-muted-foreground">Mulai</span>
            <DateTimePickerField
              v-model="session.starts_at"
              required
              placeholder="Pilih tanggal & jam"
            />
          </div>
          <div class="grid gap-1.5">
            <span class="text-xs text-muted-foreground">Selesai</span>
            <DateTimePickerField
              v-model="session.ends_at"
              required
              default-time="17:00"
              :min-date="session.starts_at"
              :error="sessionError"
              placeholder="Pilih tanggal & jam"
            />
          </div>
        </div>
        <p v-if="sessionError" class="text-xs text-destructive" role="alert">
          {{ sessionError }}
        </p>
      </div>

      <!-- Periode pendaftaran -->
      <div class="grid gap-2">
        <div class="flex items-center gap-1.5">
          <Label>
            Periode pendaftaran
            <span class="font-normal text-muted-foreground">(opsional)</span>
          </Label>
          <FieldHint
            text="Kosongkan agar pendaftaran dibuka segera saat sesi diaktifkan. Pendaftaran dibuka pukul 00:00 di tanggal awal dan ditutup pukul 23:59 di tanggal akhir."
          />
        </div>
        <DateTimeRangeField
          v-model:start="session.registration_opens_at"
          v-model:end="session.registration_closes_at"
          clearable
          :show-time="false"
          default-start-time="00:00"
          default-end-time="23:59"
          placeholder="Pilih rentang tanggal pendaftaran"
          :error="registrationError"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <div class="flex items-center gap-1.5">
            <Label for="session-quota">Kuota peserta</Label>
            <FieldHint :text="quotaHint" />
          </div>
          <NumberField
            id="session-quota"
            v-model="session.quota"
            :min="1"
            :max="selectedStudio?.max_capacity"
            :step="1"
          >
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>

        <div class="grid gap-2">
          <div class="flex items-center gap-1.5">
            <Label for="session-price">Harga per peserta</Label>
            <FieldHint text="Isi 0 untuk sesi gratis." />
          </div>
          <CurrencyInput id="session-price" v-model="session.price" />
        </div>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <Label for="session-notes">Catatan internal</Label>
            <FieldHint
              text="Hanya terlihat oleh tim, tidak tampil ke peserta."
            />
          </div>
          <span class="text-xs text-muted-foreground tabular-nums">
            {{ (session.notes ?? "").length }}/500
          </span>
        </div>
        <Textarea
          id="session-notes"
          v-model="session.notes"
          maxlength="500"
          rows="3"
          class="resize-none"
          placeholder="Catatan persiapan sesi"
        />
      </div>
    </div>
  </TooltipProvider>
</template>
