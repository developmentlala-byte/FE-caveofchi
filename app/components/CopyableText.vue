<script setup lang="ts">
import { ref } from "vue";
import { PhCheck, PhCopy } from "@phosphor-icons/vue";
import { toast } from "vue-sonner";

const props = defineProps<{ text?: string | null }>();

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy(event: MouseEvent) {
  event.stopPropagation();
  if (!props.text) return;
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 1500);
  } catch {
    toast.error("Gagal menyalin teks");
  }
}
</script>

<template>
  <span v-if="!text" class="text-muted-foreground/40">—</span>
  <button
    v-else
    type="button"
    title="Klik untuk menyalin"
    class="group inline-flex max-w-full cursor-copy items-center gap-1.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    @click="copy"
  >
    <span class="truncate"
      ><slot>{{ text }}</slot></span
    >
    <PhCheck
      v-if="copied"
      weight="bold"
      class="size-3 shrink-0 text-emerald-500"
    />
    <PhCopy
      v-else
      class="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    />
  </button>
</template>
