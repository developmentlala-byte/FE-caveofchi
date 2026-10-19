import { createHttpClient } from "~/utils/http-client";

/**
 * Menyediakan axios instance sebagai `$http`.
 * Dibuat per nuxtApp (aman untuk SSR, tidak ada state yang bocor antar request).
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
  const apiUrl = `${apiBase}/api`;
  const baseURL = apiUrl.startsWith("/")
    ? new URL(apiUrl, useRequestURL().origin).toString()
    : apiUrl;

  return {
    provide: {
      http: createHttpClient(import.meta.client ? "/backend/api" : baseURL),
    },
  };
});
