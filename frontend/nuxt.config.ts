// frontend/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  colorMode: {
    preference: "light",
  },

  // Centralized API access linking to your Express backend
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:5000/api",
    },
  },
});
