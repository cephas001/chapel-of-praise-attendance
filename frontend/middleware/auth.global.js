export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("auth_token");
  const user = useCookie("auth_user"); // Pull the user data cookie too

  // 1. Not logged in -> Kick to login
  if (!token.value && to.path !== "/login") {
    return navigateTo("/login");
  }

  // 2. Logged in, trying to reach login -> Kick to scanner
  if (token.value && to.path === "/login") {
    return navigateTo("/");
  }

  // 3. SUPER ADMIN GUARD: Trying to reach an admin page without the right role
  if (token.value && to.path.startsWith("/admin")) {
    if (user.value?.role !== "SUPER_ADMIN") {
      // Kick standard USHERs back to the scanner page
      return navigateTo("/");
    }
  }
});
