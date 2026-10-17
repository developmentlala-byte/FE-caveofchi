import { createHttpClient } from "~/utils/http-client";

/**
 * Menyediakan axios instance sebagai `$http`.
 * Dibuat per nuxtApp (aman untuk SSR, tidak ada state yang bocor antar request).
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const apiOrigin = config.public.apiBase
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

  return {
    provide: {
      http: createHttpClient(`${apiOrigin}/api`),
    },
  };
});
