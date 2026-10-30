import { apiClient, setAccessToken } from "../lib/apiClient";
import type { User, UserProfile } from "../types";
import { mapServerProfileToUserProfile } from "./profileService";

export interface AuthSessionPayload {
  user: User;
  profile: UserProfile | null;
}

export async function signupApi(
  name: string,
  email: string,
  password?: string,
): Promise<AuthSessionPayload> {
  const response = await apiClient.post("/auth/signup", {
    name,
    email,
    password: password || "SecurePass@123",
  });

  const { user, profile, accessToken } = response.data;

  // Store access token in memory for Bearer auth
  if (accessToken) {
    setAccessToken(accessToken);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: profile ? mapServerProfileToUserProfile(profile) : undefined,
    },
    profile: profile ? mapServerProfileToUserProfile(profile) : null,
  };
}

export async function loginApi(
  email: string,
  password?: string,
): Promise<AuthSessionPayload> {
  const response = await apiClient.post("/auth/login", {
    email,
    password: password || "SecurePass@123",
  });

  const { user, profile, accessToken } = response.data;

  // Store access token in memory for Bearer auth
  if (accessToken) {
    setAccessToken(accessToken);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: profile ? mapServerProfileToUserProfile(profile) : undefined,
    },
    profile: profile ? mapServerProfileToUserProfile(profile) : null,
  };
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function refreshTokenApi(): Promise<boolean> {
  try {
    const response = await apiClient.post("/auth/refresh");
    const newToken = response.data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
    }
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function getMeApi(): Promise<{
  user: User;
  profile: UserProfile | null;
} | null> {
  try {
    const response = await apiClient.get("/auth/me");
    const { user, profile } = response.data;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: profile ? mapServerProfileToUserProfile(profile) : undefined,
        preferences: user.preferences,
      },
      profile: profile ? mapServerProfileToUserProfile(profile) : null,
    };
  } catch {
    return null;
  }
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
}

export async function forgotPasswordApi(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPasswordApi(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return response.data;
}

export async function deleteAccountApi(
  password: string,
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete("/account", { data: { password } });
  return response.data;
}

export async function exportAccountDataApi(): Promise<void> {
  const response = await apiClient.get("/account/export", {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `rupeemind_data_export_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export async function updatePreferencesApi(preferences: {
  priceSignalAlerts?: boolean;
  sipReminders?: boolean;
}): Promise<{
  success: boolean;
  preferences: { priceSignalAlerts: boolean; sipReminders: boolean };
}> {
  const response = await apiClient.put("/account/preferences", preferences);
  return response.data;
}
