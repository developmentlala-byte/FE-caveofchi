import axios from "axios";
import { createHttpClient } from "~/utils/http-client";
import { ApiError } from "~/utils/api-error";
import type { AuthUser } from "~/composables/useAuth";

/**
 * Menyediakan axios instance sebagai `$http`.
 * Dibuat per nuxtApp (aman untuk SSR, tidak ada state yang bocor antar request).
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const route = useRoute();
  const authUser = useState<AuthUser | null>("auth.user", () => null);
  const authInitialized = useState("auth.initialized", () => false);
  const configuredApiBase = config.public.apiBase.trim();
  if (!configuredApiBase) {
    throw new Error("NUXT_PUBLIC_API_BASE wajib diisi untuk mengakses API BK.");
  }

  const apiBase = configuredApiBase.replace(/\/+$/, "").replace(/\/api$/, "");
  const apiUrl = `${apiBase}/api`;
  const serverBaseURL = apiUrl.startsWith("/")
    ? new URL(apiUrl, useRequestURL().origin).toString()
    : apiUrl;

  const http = createHttpClient(
    import.meta.client ? "/backend/api" : serverBaseURL,
  );

  if (import.meta.client) {
    http.interceptors.response.use(undefined, async (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.isUnauthorized &&
        !isAuthenticationRequest(error)
      ) {
        authUser.value = null;
        authInitialized.value = true;

        if (route.path !== "/login") {
          await navigateTo(
            { path: "/login", query: { redirect: route.fullPath } },
            { replace: true },
          );
        }
      }

      return Promise.reject(error);
    });
  }

  return { provide: { http } };
});

function isAuthenticationRequest(error: ApiError): boolean {
  if (!axios.isAxiosError(error.originalError)) return false;

  const requestUrl = error.originalError.config?.url;
  if (!requestUrl) return false;

  const pathname = new URL(
    requestUrl,
    import.meta.client ? window.location.origin : "http://localhost",
  ).pathname;
  return /\/(login|register|logout|user|forgot-password|reset-password)$/.test(
    pathname,
  );
}
