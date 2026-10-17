import {
  MutationCache,
  QueryCache,
  QueryClient,
  VueQueryPlugin,
  dehydrate,
  hydrate,
  type DehydratedState,
} from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import { ApiError } from "~/utils/api-error";

const MAX_RETRY = 2;

/**
 * Tampilkan pesan error untuk user di toast, dan catat detail teknis di console.
 * Matikan per query/mutation dengan `options: { meta: { silentError: true } }`.
 */
function notifyError(
  error: unknown,
  meta: Record<string, unknown> | undefined,
): void {
  if (import.meta.server || meta?.silentError) return;

  const apiError = ApiError.from(error);

  toast.error(apiError.message);

  console.error("[API Error]", {
    status: apiError.status,
    code: apiError.code,
    systemMessage: apiError.systemMessage,
    errors: apiError.errors,
  });
}

export default defineNuxtPlugin((nuxtApp) => {
  const vueQueryState = useState<DehydratedState | null>("vue-query");

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      // Toast hanya kalau tidak ada data lama di layar, supaya refetch background yang gagal tidak mengganggu.
      onError: (error, query) => {
        if (query.state.data !== undefined) return;
        notifyError(error, query.meta);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        notifyError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        // Jangan retry error 4xx (validasi, 401, 403, 404): hasilnya pasti sama.
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.status !== null &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < MAX_RETRY;
        },
      },
      // Mutation tidak di-retry otomatis supaya tidak terjadi aksi ganda (misal double POST).
      mutations: { retry: false },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  // SSR: serialisasi cache di server, lalu hydrate di client.
  if (import.meta.server) {
    nuxtApp.hooks.hook("app:rendered", () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client) {
    nuxtApp.hooks.hook("app:created", () => {
      hydrate(queryClient, vueQueryState.value);
    });
  }
});
