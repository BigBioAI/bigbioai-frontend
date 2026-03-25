import type {
  AuthTokenResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
} from "@/types/auth";
import { useAuthStore } from "@/store/authStore";

async function parseErrorResponse(response: Response): Promise<Error> {
  const fallbackMessage = "인증 처리 중 오류가 발생했습니다.";

  try {
    const data = await response.json();
    const message =
      data?.error?.message ||
      data?.error ||
      data?.detail ||
      data?.message ||
      fallbackMessage;
    const error = new Error(message);
    (error as Error & { code?: string }).code = data?.error?.code || data?.code;
    return error;
  } catch {
    return new Error(fallbackMessage);
  }
}

class AuthAPI {
  private buildAuthHeaders(extraHeaders?: HeadersInit): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      ...(extraHeaders || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async loginWithGoogle(idToken: string): Promise<GoogleAuthResponse> {
    const payload: GoogleAuthRequest = { id_token: idToken };

    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: this.buildAuthHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      }),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = (await response.json()) as GoogleAuthResponse;
    useAuthStore.getState().setSession(data.access_token, data.user);
    return data;
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: this.buildAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        useAuthStore.getState().clearSession();
        return null;
      }

      const data = (await response.json()) as AuthTokenResponse;
      useAuthStore.getState().setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: this.buildAuthHeaders(),
        credentials: "include",
      });
    } finally {
      useAuthStore.getState().clearSession();
    }
  }
}

export const authAPI = new AuthAPI();
