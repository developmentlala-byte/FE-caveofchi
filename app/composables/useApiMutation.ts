import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/vue-query";
import type { AxiosRequestConfig } from "axios";
import type { ApiError } from "~/utils/api-error";

export type MutationMethod = "post" | "put" | "patch" | "delete";

export interface UseApiMutationArgs<TData, TVariables> {
  method: MutationMethod;
  /** String tetap, atau fungsi kalau URL bergantung pada variables (misal `/studios/${id}`). */
  url: string | ((variables: TVariables) => string);
  /**
   * Pilih body request dari variables.
   * Default: seluruh variables untuk post/put/patch, dan tanpa body untuk delete.
   */
  body?: (variables: TVariables) => unknown;
  /** Config axios tambahan (header, responseType, dll). */
  config?: Omit<AxiosRequestConfig, "url" | "method" | "data" | "signal">;
  /** Query key yang di-invalidate otomatis setelah mutation sukses. */
  invalidateKeys?: readonly QueryKey[];
  /** Opsi TanStack Query (onSuccess, onError, onMutate, dll). */
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, "mutationFn">;
}

export type UseApiMethodArgs<TData, TVariables> = Omit<
  UseApiMutationArgs<TData, TVariables>,
  "method"
>;

/**
 * Mutation generik untuk semua method yang mengubah data.
 * Biasanya dipakai lewat useApiPost / useApiPut / useApiPatch / useApiDelete.
 */
export function useApiMutation<TData = unknown, TVariables = void>({
  method,
  url,
  body,
  config,
  invalidateKeys = [],
  options,
}: UseApiMutationArgs<TData, TVariables>) {
  const http = useHttp();
  const queryClient = useQueryClient();

  const resolveUrl = (variables: TVariables): string =>
    typeof url === "function" ? url(variables) : url;

  const resolveBody = (variables: TVariables): unknown => {
    if (body) return body(variables);
    return method === "delete" ? undefined : variables;
  };

  return useMutation<TData, ApiError, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      const { data } = await http.request<TData>({
        ...config,
        method,
        url: resolveUrl(variables),
        data: resolveBody(variables),
      });
      return data;
    },
    onSuccess: async (...args) => {
      await Promise.all(
        invalidateKeys.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      await options?.onSuccess?.(...args);
    },
  });
}

/**
 * POST: buat data baru.
 * @example
 * const create = useApiPost<Studio, CreateStudioPayload>({
 *   url: '/studios',
 *   invalidateKeys: [['studios']],
 * })
 * create.mutate(payload)
 */
export function useApiPost<TData = unknown, TVariables = void>(
  args: UseApiMethodArgs<TData, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ ...args, method: "post" });
}

/**
 * PUT: ganti data secara penuh.
 * @example
 * const update = useApiPut<Studio, { id: number } & StudioPayload>({
 *   url: ({ id }) => `/studios/${id}`,
 *   invalidateKeys: [['studios']],
 * })
 */
export function useApiPut<TData = unknown, TVariables = void>(
  args: UseApiMethodArgs<TData, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ ...args, method: "put" });
}

/** PATCH: ubah sebagian data. Cara pakai sama seperti useApiPut. */
export function useApiPatch<TData = unknown, TVariables = void>(
  args: UseApiMethodArgs<TData, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ ...args, method: "patch" });
}

/**
 * DELETE: hapus data. Variables biasanya cukup berupa id.
 * @example
 * const remove = useApiDelete<void, number>({
 *   url: (id) => `/studios/${id}`,
 *   invalidateKeys: [['studios']],
 * })
 * remove.mutate(studio.id)
 */
export function useApiDelete<TData = unknown, TVariables = void>(
  args: UseApiMethodArgs<TData, TVariables>,
) {
  return useApiMutation<TData, TVariables>({ ...args, method: "delete" });
}
