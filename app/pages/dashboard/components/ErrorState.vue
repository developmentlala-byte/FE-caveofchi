<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
defineEmits<{ retry: [] }>();
</script>

<template>
  <Card
    v-if="compact"
    class="flex-row items-center justify-between gap-4 border-destructive/30 bg-destructive/5 p-4"
    role="alert"
  >
    <div class="min-w-0">
      <p class="text-sm font-semibold">Pembaruan dashboard gagal</p>
      <p class="text-sm text-muted-foreground">
        Data terakhir tetap ditampilkan. Coba lagi untuk memperbaruinya.
      </p>
    </div>
    <Button
      variant="outline"
      class="shrink-0 rounded-full"
      @click="$emit('retry')"
    >
      Coba lagi
    </Button>
  </Card>
  <Card v-else class="items-center gap-3 px-6 py-16 text-center" role="alert">
    <p class="text-sm font-semibold">Data dashboard gagal dimuat</p>
    <p class="max-w-sm text-sm text-muted-foreground">
      Periksa koneksi Anda lalu coba lagi. Filter yang dipilih tidak berubah.
    </p>
    <Button variant="outline" class="rounded-full" @click="$emit('retry')">
      Coba lagi
    </Button>
  </Card>
</template>
