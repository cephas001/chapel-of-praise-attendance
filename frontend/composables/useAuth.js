import { useCookie } from "#app";

export const useAuth = () => {
  const user = useCookie("auth_user", { default: () => null, maxAge: 604800 });
  const token = useCookie("auth_token", {
    default: () => null,
    maxAge: 604800,
  });

  const login = async (email, password) => {
    try {
      const data = await useApiFetch("/login", {
        method: "POST",
        body: { email, password },
      });

      user.value = data.user;
      token.value = data.token;
    } catch (error) {
      throw new Error(error.data?.error || "Invalid username or password");
    }
  };

  // --- NEW: Centralized Google API Call ---
  const googleLogin = async (firebaseToken) => {
    try {
      const data = await useApiFetch("/google", {
        method: "POST",
        body: { token: firebaseToken },
      });

      user.value = data.user;
      token.value = data.token;
    } catch (error) {
      // Pass the specific backend message (e.g. "Access Denied: Email not registered")
      throw new Error(error.data?.message || "Failed to connect to server.");
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
  };

  return { user, token, login, googleLogin, logout };
};