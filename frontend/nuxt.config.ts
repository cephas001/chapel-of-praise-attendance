// frontend/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@pinia/nuxt", "@nuxt/icon", "@vite-pwa/nuxt"],

  routeRules: {
    "/": { redirect: "/scanner" },
  },

  css: ["~/assets/css/main.css"],

  colorMode: {
    preference: "light",
  },

  ssr: false,

  pwa: {
    registerType: "prompt", // We use prompt so we can show an "Update" button when you push new code
    manifest: {
      name: "Chapel of Praise Scanner",
      short_name: "COP Scanner",
      description: "Offline-first attendance scanner and admin dashboard.",
      theme_color: "#000000",
      background_color: "#ffffff",
      display: "standalone", // This hides the browser URL bar to make it look like a native app
      orientation: "portrait",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable", // Crucial for Android home screen icons
        },
      ],
    },
    workbox: {
      // This tells the service worker to cache ALL your JS, CSS, and HTML for offline use
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      // Increase the file size limit to 3MB just in case your bundled assets get large
      maximumFileSizeToCacheInBytes: 3000000,

      // NEW: The magic rule that fixes the "You're offline" screen
      navigateFallback: "/",
      // NEW: Ensures query parameters (like ?event=123) don't break the offline cache
      ignoreURLParametersMatching: [/.*/],
    },
    devOptions: {
      enabled: true, // Lets you test the PWA locally
      type: "module",
    },
  },

  // Centralized API access linking to your Express backend
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:5000/api",
      googleClientID: process.env.GOOGLE_CLIENT_ID,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
  },
});
