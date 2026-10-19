import axios, { type AxiosInstance } from "axios";
import { ApiError } from "~/utils/api-error";

/**
 * Factory axios instance.
 * Semua konfigurasi global (baseURL, timeout, header, interceptor) ada di sini.
 */
export function createHttpClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  // Contoh titik perluasan: tambahkan token di sini kalau pakai Bearer token.
  // client.interceptors.request.use((config) => {
  //   const token = useCookie('auth_token').value
  //   if (token) config.headers.Authorization = `Bearer ${token}`
  //   return config
  // })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      // Request yang dibatalkan (signal TanStack Query) dibiarkan apa adanya.
      if (axios.isCancel(error)) return Promise.reject(error);
      return Promise.reject(ApiError.from(error));
    },
  );

  return client;
}
