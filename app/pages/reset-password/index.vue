<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "~/utils/api-error";

const route = useRoute();
const { bootstrapCsrf } = useAuth();
const { $http } = useNuxtApp();
const email = computed(() =>
  typeof route.query.email === "string" ? route.query.email : "",
);
const token = computed(() =>
  typeof route.query.token === "string" ? route.query.token : "",
);
const password = ref("");
const passwordConfirmation = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

async function submit(): Promise<void> {
  if (!email.value || !token.value) {
    errorMessage.value = "Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await bootstrapCsrf();
    await $http.post("/reset-password", {
      email: email.value,
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    toast.success("Kata sandi berhasil diperbarui.");
    await navigateTo("/login");
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : "Tidak dapat mengatur ulang kata sandi. Silakan coba lagi.";
    if (!(error instanceof ApiError)) console.error(error);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle>Atur kata sandi baru</CardTitle>
        <CardDescription>
          Buat kata sandi baru untuk akun {{ email || "Anda" }}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <p
            v-if="errorMessage"
            role="alert"
            class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {{ errorMessage }}
          </p>
          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-medium">Kata sandi baru</label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="password-confirmation" class="text-sm font-medium">
              Konfirmasi kata sandi
            </label>
            <Input
              id="password-confirmation"
              v-model="passwordConfirmation"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Memproses..." : "Simpan kata sandi" }}
          </Button>
          <NuxtLink
            to="/login"
            class="text-center text-sm text-primary underline-offset-4 hover:underline"
          >
            Kembali ke halaman masuk
          </NuxtLink>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
