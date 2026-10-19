import { toast } from "vue-sonner";
import { ApiError } from "~/utils/api-error";

interface ToastPromiseMessages<TData> {
  loading: string;
  success: string | ToastMessage | ((data: TData) => string | ToastMessage);
  error?:
    | string
    | ToastMessage
    | ((error: unknown) => string | ToastMessage);
}

interface ToastMessage {
  title: string;
  description?: string;
  duration?: number;
}

interface WithToastPromiseOptions {
  rethrow?: boolean;
}

export function withToastPromise<TData>(
  operation: () => Promise<TData>,
  messages: ToastPromiseMessages<TData>,
): Promise<TData | undefined>;
export function withToastPromise<TData>(
  operation: () => Promise<TData>,
  messages: ToastPromiseMessages<TData>,
  options: { rethrow: true },
): Promise<TData>;
export async function withToastPromise<TData>(
  operation: () => Promise<TData>,
  messages: ToastPromiseMessages<TData>,
  options?: WithToastPromiseOptions,
): Promise<TData | undefined> {
  const promise = Promise.resolve().then(operation);

  toast.promise(promise, {
    loading: messages.loading,
    success: (data) => toPromiseToastMessage(resolve(messages.success, data)),
    error: (error) =>
      toPromiseToastMessage(
        messages.error
          ? resolve(messages.error, error)
          : {
              title: "Permintaan gagal",
              description: ApiError.from(error).userMessage,
              duration: 6000,
            },
      ),
  });

  try {
    return await promise;
  } catch (error) {
    if (options?.rethrow) throw error;
    return undefined;
  }
}

function resolve<TValue>(
  message: string | ToastMessage | ((value: TValue) => string | ToastMessage),
  value: TValue,
): string | ToastMessage {
  return typeof message === "function" ? message(value) : message;
}

function toPromiseToastMessage(message: string | ToastMessage) {
  if (typeof message === "string") return message;

  return {
    message: message.title,
    description: message.description,
    duration: message.duration,
  };
}
