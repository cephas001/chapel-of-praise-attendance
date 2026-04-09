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
    // NEW: Automatically catch Auth errors globally
    onResponseError({ response }) {
      if (response.status === 401 || response.status === 403) {
        // Wipe the cookies
        token.value = null;
        user.value = null;
        // Kick them out
        alert("Session expired. Please log in again.");
        navigateTo("/login");
      }
    },
  });
};
