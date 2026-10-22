<script setup lang="ts">
import { Card } from "@/components/ui/card";

interface Definition {
  term: string;
  text: string;
}

const props = defineProps<{ data?: Definition[] }>();

const dummy: Definition[] = [
  {
    term: "Booking yang dihitung",
    text: "Hanya booking berstatus lunas. Booking menunggu, dibatalkan, atau kedaluwarsa tidak masuk pendapatan.",
  },
  {
    term: "Fill rate",
    text: "Peserta terdaftar dibagi total kuota sesi. Makin tinggi berarti makin sedikit kursi kosong.",
  },
  {
    term: "Slot terpakai",
    text: "Sesi terjadwal dibagi slot tersedia (3 per hari). Menunjukkan seberapa penuh jadwal studio, bukan kuota.",
  },
  {
    term: "Tingkat pembatalan",
    text: "Booking dibatalkan ditambah kedaluwarsa, dibagi seluruh booking yang dibuat pada periode.",
  },
  {
    term: "Lead time",
    text: "Rata-rata selisih hari antara tanggal booking dan tanggal sesi. Dipakai untuk menentukan kapan mulai promosi.",
  },
];
</script>

<template>
  <Card class="group p-0">
    <details>
      <summary
        class="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 [&::-webkit-details-marker]:hidden"
      >
        <div>
          <p class="text-base font-semibold">Cara membaca angka</p>
          <p class="text-sm text-muted-foreground">
            Arti tiap metrik di dashboard ini
          </p>
        </div>
        <span
          class="text-sm text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
          >▾</span
        >
      </summary>

      <dl
        class="grid gap-x-8 gap-y-5 border-t px-6 py-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="d in props.data ?? dummy"
          :key="d.term"
          class="flex flex-col gap-1"
        >
          <dt class="text-sm font-medium">{{ d.term }}</dt>
          <dd class="text-sm leading-relaxed text-muted-foreground">
            {{ d.text }}
          </dd>
        </div>
      </dl>
    </details>
  </Card>
</template>
