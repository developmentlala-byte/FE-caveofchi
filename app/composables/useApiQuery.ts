import { computed, toValue, type MaybeRefOrGetter } from "vue";
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/vue-query";
import type { AxiosRequestConfig } from "axios";
import type { ApiError } from "~/utils/api-error";

export type QueryParams = Record<string, unknown>;

/** Method HTTP untuk operasi baca. QUERY dapat membawa filter kompleks di body. */
export type ReadMethod = "GET" | "QUERY";

export const DEFAULT_READ_METHOD: ReadMethod = "GET";

export type ApiQueryOptions<TData, TSelected = TData> = Omit<
  UseQueryOptions<TData, ApiError, TSelected>,
  "queryKey" | "queryFn"
>;

export interface UseApiQueryArgs<TData, TSelected = TData> {
  /** Key cache. Boleh ref/getter supaya otomatis refetch saat berubah. */
  queryKey: MaybeRefOrGetter<QueryKey>;
  /** Endpoint, relatif terhadap baseURL. Boleh ref/getter. */
  url: MaybeRefOrGetter<string>;
  /** Query string. Boleh ref/getter. */
  params?: MaybeRefOrGetter<QueryParams | undefined>;
  /** Method baca. Default: DEFAULT_READ_METHOD. */
  method?: ReadMethod;
  /** Body request, hanya dikirim untuk method QUERY. */
  body?: MaybeRefOrGetter<unknown>;
  /** Config axios tambahan (header, responseType, dll). */
  config?: Omit<
    AxiosRequestConfig,
    "url" | "method" | "params" | "data" | "signal"
  >;
  /** Opsi TanStack Query (enabled, staleTime, select, placeholderData, dll). */
  options?: ApiQueryOptions<TData, TSelected>;
}

/**
 * GET request berbasis TanStack Query.
 *
 * @example
 * const { data, isPending } = useApiQuery<Studio[]>({
 *   queryKey: ['studios', filters],
 *   url: '/studios',
 *   params: filters,
 * })
 */
export function useApiQuery<TData = unknown, TSelected = TData>({
  queryKey,
  url,
  params,
  method = DEFAULT_READ_METHOD,
  body,
  config,
  options,
}: UseApiQueryArgs<TData, TSelected>) {
  const http = useHttp();

  return useQuery<TData, ApiError, TSelected>(
    computed(() => ({
      ...options,
      queryKey: toValue(queryKey),
      queryFn: async ({ signal }) => {
        const { data } = await http.request<TData>({
          ...config,
          method,
          url: toValue(url),
          params: toValue(params),
          data: method === "QUERY" ? toValue(body) : undefined,
          signal, // request otomatis dibatalkan kalau query tidak dibutuhkan lagi
        });
        return data;
      },
    })),
  );
}
