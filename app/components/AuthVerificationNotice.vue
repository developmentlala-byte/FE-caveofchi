<script setup lang="ts">
import { ref } from "vue";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "~/utils/api-error";

const { user, bootstrapCsrf } = useAuth();
const { $http } = useNuxtApp();
const isSending = ref(false);

async function resendVerification(): Promise<void> {
  isSending.value = true;

  try {
    await bootstrapCsrf();
    await $http.post("/email/verification-notification");
    toast.success("Tautan verifikasi berhasil dikirim.");
  } catch (error) {
    toast.error(
      error instanceof ApiError
        ? error.message
        : "Tidak dapat mengirim tautan verifikasi.",
    );
    if (!(error instanceof ApiError)) console.error(error);
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <div
    v-if="user && !user.email_verified_at"
    class="flex flex-col gap-3 border-b border-border bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-7"
  >
    <p class="text-sm text-muted-foreground">
      Verifikasi email <span class="font-medium text-foreground">{{ user.email }}</span>
      untuk menyelesaikan pengaturan akun.
    </p>
    <Button
      type="button"
      variant="outline"
      size="sm"
      :disabled="isSending"
      @click="resendVerification"
    >
      {{ isSending ? "Mengirim..." : "Kirim ulang tautan" }}
    </Button>
  </div>
</template>
