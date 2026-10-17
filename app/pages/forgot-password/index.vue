<script setup lang="ts">
import { ref } from "vue";
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

const { bootstrapCsrf } = useAuth();
const { $http } = useNuxtApp();
const email = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const isSubmitted = ref(false);

async function submit(): Promise<void> {
  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    await bootstrapCsrf();
    await $http.post("/forgot-password", { email: email.value });
    isSubmitted.value = true;
    toast.success("Permintaan reset kata sandi diproses.");
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : "Tidak dapat mengirim permintaan. Silakan coba lagi.";
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
        <CardTitle>Lupa kata sandi?</CardTitle>
        <CardDescription>
          Masukkan email dan kami akan mengirim tautan untuk mengatur ulang kata
          sandi.
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
          <p v-if="isSubmitted" role="status" class="text-sm text-muted-foreground">
            Jika email tersebut terdaftar, tautan reset kata sandi akan segera
            dikirim.
          </p>
          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
            />
          </div>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Mengirim..." : "Kirim tautan reset" }}
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
