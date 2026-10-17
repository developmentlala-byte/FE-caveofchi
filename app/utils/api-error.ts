import { isAxiosError } from "axios";

/** Bentuk body error standar Laravel (422 validation, 4xx/5xx umum). */
interface LaravelErrorBody {
  /** Pesan untuk user (aman ditampilkan di toast). */
  message?: string;
  /** Kode error aplikasi yang stabil, misal STUDIO_NOT_FOUND. */
  code?: string;
  /** Pesan teknis untuk developer/log. Hanya ada di response saat debug. */
  system_message?: string;
  errors?: Record<string, string[]>;
}

export type FieldErrors = Record<string, string[]>;

const DEFAULT_USER_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";

interface ApiErrorInit {
  /** Pesan untuk user. Ini yang ditampilkan di toast. */
  message: string;
  /** Pesan teknis untuk developer (console/log), bukan untuk user. */
  systemMessage?: string;
  status?: number | null;
  errors?: FieldErrors | null;
  code?: string;
  originalError?: unknown;
}

/**
 * Error tunggal untuk seluruh layer HTTP.
 * Semua error axios dinormalisasi ke class ini lewat response interceptor,
 * jadi komponen cukup menangani satu tipe error.
 */
export class ApiError extends Error {
  readonly systemMessage: string;
  readonly status: number | null;
  readonly errors: FieldErrors | null;
  readonly code?: string;
  readonly originalError: unknown;

  constructor({
    message,
    systemMessage,
    status = null,
    errors = null,
    code,
    originalError,
  }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.systemMessage = systemMessage ?? message;
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.originalError = originalError;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status !== null && this.status >= 500;
  }

  /** True kalau request tidak sampai ke server (offline, timeout, CORS, dll). */
  get isNetworkError(): boolean {
    return this.status === null;
  }

  /** Pesan error pertama untuk satu field (berguna untuk form). */
  firstError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (isAxiosError<LaravelErrorBody>(error)) {
      const status = error.response?.status ?? null;
      const body = error.response?.data;

      return new ApiError({
        // Jangan pernah jatuh ke error.message axios untuk user (isinya teknis, misal "Request failed with status code 500").
        message:
          body?.message ??
          (status === null
            ? "Tidak dapat terhubung ke server. Periksa koneksi internet kamu."
            : DEFAULT_USER_MESSAGE),
        systemMessage: body?.system_message ?? error.message,
        status,
        errors: body?.errors ?? null,
        code: body?.code ?? error.code,
        originalError: error,
      });
    }

    return new ApiError({
      message: DEFAULT_USER_MESSAGE,
      systemMessage: error instanceof Error ? error.message : String(error),
      originalError: error,
    });
  }
}
