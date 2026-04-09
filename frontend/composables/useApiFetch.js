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
  });
};
