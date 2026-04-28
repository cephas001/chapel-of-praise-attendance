// frontend/composables/useApiFetch.js
import { useCookie, useRuntimeConfig, navigateTo } from "#app";

export const useApiFetch = (request, opts) => {
  const config = useRuntimeConfig();
  const token = useCookie("auth_token");
  const user = useCookie("auth_user");

  return $fetch(request, {
    baseURL: config.public.apiBase,
    ...opts,
    headers: {
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...opts?.headers,
    },

    // NEW: Intercept errors globally
    async onResponseError({ response }) {
      // IDEAL SCENARIO: Your backend sends 401 for expired tokens
      const isTokenExpired = response.status === 401;

      // FALLBACK SCENARIO: If you MUST use 403, check the exact error message your backend sends
      // const isTokenExpired = response.status === 403 && response._data?.error === "jwt expired";

      if (isTokenExpired) {
        // 1. Wipe the invalid credentials from local storage
        token.value = null;
        user.value = null;

        // 2. Redirect to login.
        // Using replace: true prevents them from clicking the "Back" button to return to the broken page
        await navigateTo("/login", { replace: true });
      }
    },
  });
};
