// frontend/composables/useAuth.js
import { useState } from "#app";

export const useAuth = () => {
  // Define our reactive state variables
  const user = useState("auth_user", () => null);
  const token = useState("auth_token", () => null);

  // Function to check local storage when the app loads
  const initAuth = () => {
    if (process.client) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) user.value = JSON.parse(storedUser);
      token.value = localStorage.getItem("token") || null;
    }
  };

  // Function to talk to our Express API and log in
  const login = async (username, password) => {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error("Invalid username or password");

    const data = await res.json();

    // Save to Nuxt state
    user.value = data.user;
    token.value = data.token;

    // Save to the browser's persistent local storage
    if (process.client) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    }
  };

  // Function to log out
  const logout = () => {
    user.value = null;
    token.value = null;
    if (process.client) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  return { user, token, initAuth, login, logout };
};
