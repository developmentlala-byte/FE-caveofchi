import type { AxiosInstance } from "axios";

/** Akses axios instance global (disediakan oleh plugins/http.ts). */
export function useHttp(): AxiosInstance {
  return useNuxtApp().$http as AxiosInstance;
}
