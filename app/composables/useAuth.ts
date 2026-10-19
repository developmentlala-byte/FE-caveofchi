import { ApiError } from "~/utils/api-error";

export interface AuthRole {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  roles: AuthRole[];
}

interface ApiEnvelope<T> {
  data: T;
}

function apiOrigin(apiBase: string): string {
  return apiBase.replace(/\/+$/, "").replace(/\/api$/, "");
}

export function useAuth() {
  const config = useRuntimeConfig();
  const { $http: http } = useNuxtApp();
  const user = useState<AuthUser | null>("auth.user", () => null);
  const initialized = useState("auth.initialized", () => false);

  async function fetchCurrentUser(): Promise<AuthUser | null> {
    if (initialized.value) return user.value;

    try {
      const headers = import.meta.server
        ? {
            ...useRequestHeaders(["cookie"]),
            Origin: useRequestURL().origin,
          }
        : undefined;
      const { data } = await http.get<ApiEnvelope<AuthUser>>("/user", {
        headers,
      });
      user.value =
        data.data && typeof data.data.id === "number" ? data.data : null;
      initialized.value = true;
      return user.value;
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        user.value = null;
        initialized.value = true;
        return null;
      }

      throw error;
    }
  }

  async function bootstrapCsrf(): Promise<void> {
    const csrfUrl = import.meta.client
      ? new URL(
          "/backend/sanctum/csrf-cookie",
          useRequestURL().origin,
        ).toString()
      : new URL(
          `${apiOrigin(config.public.apiBase)}/sanctum/csrf-cookie`,
          useRequestURL().origin,
        ).toString();

    await http.get(csrfUrl);
  }

  async function login(
    email: string,
    password: string,
    remember = false,
  ): Promise<AuthUser> {
    await bootstrapCsrf();
    await http.post("/login", { email, password, remember });
    initialized.value = false;

    const authenticatedUser = await fetchCurrentUser();
    if (!authenticatedUser) {
      throw new Error("Sesi berhasil dibuat tetapi data pengguna tidak tersedia.");
    }

    return authenticatedUser;
  }

  async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<AuthUser> {
    await bootstrapCsrf();
    const { data } = await http.post<ApiEnvelope<AuthUser>>("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    user.value = data.data;
    initialized.value = true;

    return data.data;
  }

  async function logout(): Promise<void> {
    try {
      await bootstrapCsrf();
      await http.post("/logout");
    } catch (error) {
      if (!(error instanceof ApiError && error.isUnauthorized)) throw error;
    } finally {
      user.value = null;
      initialized.value = true;
    }
  }

  return {
    user,
    fetchCurrentUser,
    bootstrapCsrf,
    login,
    register,
    logout,
  };
}
