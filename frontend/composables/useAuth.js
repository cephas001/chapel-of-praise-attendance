import { useCookie } from "#app";

// Keep this prefix in sync with the API runtime cache names in nuxt.config.ts.
const API_CACHE_PREFIX = "api-";

export const useAuth = () => {
  const user = useCookie("auth_user", { default: () => null, maxAge: 604800 });
  const token = useCookie("auth_token", {
    default: () => null,
    maxAge: 604800,
  });

  const clearApiCaches = async () => {
    if (!import.meta.client || typeof caches === "undefined") return;

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(API_CACHE_PREFIX))
        .map((name) => caches.delete(name)),
    );
  };

  const login = async (email, password) => {
    try {
      const data = await useApiFetch("/login", {
        method: "POST",
        body: { email, password },
      });

      // Do not let a previous account's cached roster/API data survive a
      // fast account switch on the same device.
      try {
        await clearApiCaches();
      } catch (error) {
        console.warn("Failed to clear cached API data during login.", error);
      }

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

      try {
        await clearApiCaches();
      } catch (error) {
        console.warn("Failed to clear cached API data during login.", error);
      }

      user.value = data.user;
      token.value = data.token;
    } catch (error) {
      // Pass the specific backend message (e.g. "Access Denied: Email not registered")
      throw new Error(
        error.data?.error ||
          error.data?.message ||
          "Failed to connect to server.",
      );
    }
  };

  const logout = async () => {
    user.value = null;
    token.value = null;

    // API responses cached by the service worker can contain user-specific
    // data (for example a roster or my-duty assignments). Remove them before
    // the next account uses this device. Precache and media/font caches are
    // intentionally left intact so offline assets still work.
    try {
      await clearApiCaches();

      // A request that was already in flight when logout was tapped can finish
      // after the first pass and repopulate one of these caches. Retry after
      // logout has settled and once more after the NetworkFirst timeout window.
      // Skip the cleanup if a new session has already started. This is
      // best-effort and must not delay the logout flow.
      if (import.meta.client) {
        for (const delay of [1000, 5000]) {
          setTimeout(() => {
            if (token.value) return;

            clearApiCaches().catch((error) => {
              console.warn(
                "Failed to clear cached API data during logout.",
                error,
              );
            });
          }, delay);
        }
      }
    } catch (error) {
      console.warn("Failed to clear cached API data during logout.", error);
    }
  };

  return { user, token, login, googleLogin, logout };
};