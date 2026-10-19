<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner";
import {
  PhCheckCircle,
  PhInfo,
  PhCircleNotch,
  PhXCircle,
  PhWarning,
  PhX,
} from "@phosphor-icons/vue";
import { cn } from "cn";
import { Toaster as Sonner } from "vue-sonner";
import "vue-sonner/style.css";

const props = withDefaults(defineProps<ToasterProps>(), {
  position: "top-right",
  theme: "dark",
  // Selalu tampil penuh (tanpa mode tumpuk yang mengecil) supaya ukuran dan
  // padding toast sama baik saat di-hover maupun tidak.
  expand: true,
  duration: 4000,
  visibleToasts: 3,
  gap: 14,
});

// Gaya mengikuti toast shadcn: kartu gelap rata, border tipis, judul tebal
// kecil, deskripsi di bawahnya, dan tombol aksi putih kecil di sisi kanan.
const defaultClasses = {
  toast:
    "dark !items-center !gap-3 !rounded-lg !border !border-border !bg-overlay !px-4 !py-3.5 !font-sans !text-overlay-foreground !shadow-lg !shadow-black/40",
  icon: "!mx-0 !size-[18px] !shrink-0",
  content: "!gap-1",
  title: "!text-sm !font-semibold !leading-5 !text-foreground",
  description: "!text-[13px] !leading-[18px] !text-muted-foreground",
  actionButton:
    "!ml-auto !h-7 !shrink-0 !rounded-md !bg-foreground !px-3 !text-xs !font-medium !text-background transition-opacity hover:!opacity-90",
  cancelButton:
    "!h-7 !shrink-0 !rounded-md !bg-default !px-3 !text-xs !font-medium !text-default-foreground transition-opacity hover:!opacity-80",
  closeButton:
    "!border-border !bg-overlay !text-muted-foreground hover:!bg-default hover:!text-foreground",
};

const toastOptions = computed(() => ({
  ...props.toastOptions,
  classes: { ...defaultClasses, ...props.toastOptions?.classes },
}));
</script>

<template>
  <Sonner
    v-bind="props"
    :class="cn('toaster group', props.class)"
    :toast-options="toastOptions"
    :style="{
      '--normal-bg': 'var(--overlay)',
      '--normal-text': 'var(--overlay-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
      '--width': '356px',
    }"
  >
    <template #success-icon>
      <PhCheckCircle weight="fill" class="size-[18px] text-success" />
    </template>
    <template #info-icon>
      <PhInfo weight="fill" class="size-[18px] text-muted-foreground" />
    </template>
    <template #warning-icon>
      <PhWarning weight="fill" class="size-[18px] text-warning" />
    </template>
    <template #error-icon>
      <PhXCircle weight="fill" class="size-[18px] text-danger" />
    </template>
    <template #loading-icon>
      <PhCircleNotch class="size-[18px] animate-spin text-muted-foreground" />
    </template>
    <template #close-icon>
      <PhX class="size-3.5" />
    </template>
  </Sonner>
</template>
