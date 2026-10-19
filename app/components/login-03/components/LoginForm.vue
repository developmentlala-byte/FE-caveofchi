<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed, reactive, ref } from "vue";
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
import { withToastPromise } from "~/utils/toast-promise";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    mode?: "login" | "register";
  }>(),
  { mode: "login" },
);

const route = useRoute();
const { login, register } = useAuth();
const isRegister = computed(() => props.mode === "register");
const isSubmitting = ref(false);
const errorMessage = ref("");
const fieldErrors = reactive<Record<string, string>>({});
const form = reactive({
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
  remember: false,
});

const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/dashboard";
});

async function submit(): Promise<void> {
  isSubmitting.value = true;
  errorMessage.value = "";
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key]);

  try {
    if (isRegister.value) {
      await withToastPromise(
        () =>
          register(
            form.name,
            form.email,
            form.password,
            form.passwordConfirmation,
          ),
        {
          loading: "Membuat akun...",
          success: "Akun berhasil dibuat.",
          error: (error) => ApiError.from(error).userMessage,
        },
        { rethrow: true },
      );
      await navigateTo("/dashboard");
      return;
    }

    await withToastPromise(
      () => login(form.email, form.password, form.remember),
      {
        loading: "Masuk ke dashboard...",
        success: "Berhasil masuk.",
        error: (error) => ApiError.from(error).userMessage,
      },
      { rethrow: true },
    );
    await navigateTo(redirectPath.value);
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage.value = error.message;
      for (const [field, messages] of Object.entries(error.errors ?? {})) {
        fieldErrors[field] = messages[0] ?? "";
      }
    } else {
      errorMessage.value = "Tidak dapat menyelesaikan permintaan. Silakan coba lagi.";
      console.error(error);
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          {{ isRegister ? "Buat akun staff" : "Selamat datang kembali" }}
        </CardTitle>
        <CardDescription>
          {{
            isRegister
              ? "Daftar untuk mengakses dashboard Cave Of Chi."
              : "Masuk menggunakan email dan kata sandi akun Anda."
          }}
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

          <div v-if="isRegister" class="flex flex-col gap-2">
            <label for="name" class="text-sm font-medium">Nama</label>
            <Input
              id="name"
              v-model="form.name"
              autocomplete="name"
              required
              maxlength="255"
              :aria-invalid="Boolean(fieldErrors.name)"
            />
            <p v-if="fieldErrors.name" class="text-sm text-destructive">
              {{ fieldErrors.name }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label for="email" class="text-sm font-medium">Email</label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              :aria-invalid="Boolean(fieldErrors.email)"
            />
            <p v-if="fieldErrors.email" class="text-sm text-destructive">
              {{ fieldErrors.email }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <label for="password" class="text-sm font-medium">Kata sandi</label>
              <NuxtLink
                v-if="!isRegister"
                to="/forgot-password"
                class="text-sm text-primary underline-offset-4 hover:underline"
              >
                Lupa kata sandi?
              </NuxtLink>
            </div>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              required
              :aria-invalid="Boolean(fieldErrors.password)"
            />
            <p v-if="fieldErrors.password" class="text-sm text-destructive">
              {{ fieldErrors.password }}
            </p>
          </div>

          <div v-if="isRegister" class="flex flex-col gap-2">
            <label for="password-confirmation" class="text-sm font-medium">
              Konfirmasi kata sandi
            </label>
            <Input
              id="password-confirmation"
              v-model="form.passwordConfirmation"
              type="password"
              autocomplete="new-password"
              required
              :aria-invalid="Boolean(fieldErrors.password_confirmation)"
            />
            <p
              v-if="fieldErrors.password_confirmation"
              class="text-sm text-destructive"
            >
              {{ fieldErrors.password_confirmation }}
            </p>
            <p class="text-xs text-muted-foreground">
              Akun baru akan dibuat dengan role Staff.
            </p>
          </div>

          <label v-if="!isRegister" class="flex items-center gap-2 text-sm">
            <input
              v-model="form.remember"
              type="checkbox"
              class="size-4 rounded border-input accent-primary"
            />
            Ingat saya
          </label>

          <Button class="w-full" type="submit" :disabled="isSubmitting">
            {{
              isSubmitting
                ? "Memproses..."
                : isRegister
                  ? "Daftar"
                  : "Masuk"
            }}
          </Button>

          <p class="text-center text-sm text-muted-foreground">
            {{ isRegister ? "Sudah memiliki akun?" : "Belum memiliki akun?" }}
            <NuxtLink
              :to="isRegister ? '/login' : '/register'"
              class="font-medium text-primary underline-offset-4 hover:underline"
            >
              {{ isRegister ? "Masuk" : "Daftar" }}
            </NuxtLink>
          </p>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
