import { useCookie } from "#app";
// Note: useApiFetch is auto-imported by Nuxt!

export const useAuth = () => {
  const user = useCookie("auth_user", { default: () => null, maxAge: 604800 });
  const token = useCookie("auth_token", {
    default: () => null,
    maxAge: 604800,
  });

  const login = async (email, password) => {
    try {
      // No URL hardcoding, no headers, no JSON.stringify, no res.json()!
      const data = await useApiFetch("/login", {
        method: "POST",
        body: { email, password },
      });

      user.value = data.user;
      token.value = data.token;
    } catch (error) {
      // $fetch automatically throws an error if status is not 2xx
      throw new Error(error.data?.error || "Invalid username or password");
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
  };

  return { user, token, login, logout };
};
