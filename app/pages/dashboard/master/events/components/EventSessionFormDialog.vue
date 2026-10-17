<script setup lang="ts">
import { ref, watch } from "vue";
import type {
  EventSession,
  EventSessionFormValues,
  Studio,
} from "../types/event.types";
import EventSessionFields from "./EventSessionFields.vue";
import { fromJakartaIso } from "~/utils/jakarta-date-time";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

const open = defineModel<boolean>("open", { required: true });
const props = defineProps<{
  session: EventSession | null;
  studios: Studio[];
  studiosLoading: boolean;
  studiosError: boolean;
  loading: boolean;
}>();
const emit = defineEmits<{
  submit: [values: EventSessionFormValues];
  refreshStudios: [];
}>();

const emptyForm = (): EventSessionFormValues => ({
  studio_id: props.studios[0]?.id ?? null,
  starts_at: "",
  ends_at: "",
  registration_opens_at: "",
  registration_closes_at: "",
  quota: 1,
  price: 0,
  notes: "",
});

const form = ref<EventSessionFormValues>(emptyForm());

watch(
  () => [open.value, props.session, props.studios] as const,
  ([isOpen, session, studios]) => {
    if (!isOpen) return;
    form.value = session
      ? {
          studio_id: session.studio_id,
          starts_at: fromJakartaIso(session.starts_at),
          ends_at: fromJakartaIso(session.ends_at),
          registration_opens_at: fromJakartaIso(
            session.registration_opens_at,
          ),
          registration_closes_at: fromJakartaIso(
            session.registration_closes_at,
          ),
          quota: session.quota,
          price: session.price,
          notes: session.notes ?? "",
        }
      : {
          ...emptyForm(),
          studio_id: studios[0]?.id ?? null,
        };
  },
);

const submit = () => emit("submit", { ...form.value });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
    >
      <DialogHeader class="px-6 pt-6 pb-4 text-left">
        <DialogTitle>{{ session ? "Edit sesi" : "Tambah sesi" }}</DialogTitle>
        <DialogDescription>
          Atur studio, jadwal, periode pendaftaran, kuota, dan harga sesi.
        </DialogDescription>
      </DialogHeader>

      <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
        <div class="min-h-0 flex-1 overflow-y-auto border-y px-6 py-5">
          <EventSessionFields
            v-model="form"
            :studios="studios"
            :studios-loading="studiosLoading"
            :studios-error="studiosError"
            @refresh-studios="emit('refreshStudios')"
          />
        </div>

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
              studiosLoading ||
              studiosError ||
              studios.length === 0 ||
              form.studio_id === null
            "
          >
            <Spinner v-if="loading" />
            {{
              loading
                ? "Menyimpan..."
                : session
                  ? "Simpan perubahan"
                  : "Simpan sesi"
            }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
