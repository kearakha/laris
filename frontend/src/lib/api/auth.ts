import { ApiResponse, User } from "@/lib/types";
import apiClient from "./client";

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const DEMO_BASE: Omit<User, "id" | "name" | "email" | "roles"> = {
  phone: null,
  avatar: null,
  is_active: true,
  last_login_at: null,
  permissions: [],
  tenant: null,
  outlet: null,
};

const DEMO_ACCOUNTS: Record<string, { token: string; user: User }> = {
  "demo@laris.app": {
    token: "demo-token-tenant-owner",
    user: {
      ...DEMO_BASE,
      id: 1,
      name: "Demo Owner",
      email: "demo@laris.app",
      roles: ["tenant_owner"],
    },
  },
  "kasir@laris.app": {
    token: "demo-token-kasir",
    user: {
      ...DEMO_BASE,
      id: 2,
      name: "Demo Kasir",
      email: "kasir@laris.app",
      roles: ["kasir"],
    },
  },
};

export const authApi = {
  login: (data: LoginPayload) => {
    const demo = DEMO_ACCOUNTS[data.email];
    if (demo && data.password === "demo1234") {
      return Promise.resolve({
        data: {
          success: true,
          message: "Login berhasil",
          data: { token: demo.token, user: demo.user },
        },
      } as any);
    }
    return apiClient.post<ApiResponse<LoginResponse>>("/v1/auth/login", data);
  },

  logout: () => apiClient.post<ApiResponse<null>>("/v1/auth/logout"),

  profile: () => apiClient.get<ApiResponse<User>>("/v1/auth/profile"),

  updateProfile: (data: FormData) =>
    apiClient.put<ApiResponse<User>>("/v1/auth/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
