// frontend/nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui", "@nuxt/icon", "@vite-pwa/nuxt"],

  // Fonts are self-hosted in assets/css/main.css. Disable @nuxt/fonts so it
  // cannot auto-download a second copy of the same families.
  ui: {
    fonts: false,
  },

  app: {
    head: {
      title: "COPAMS",
      meta: [
        {
          name: "description",
          content: "Offline-first attendance management system.",
        },
        { name: "theme-color", content: "#F4F5F1" },
      ],
    },
  },

  routeRules: {
    "/": { redirect: "/scanner" },
  },

  css: ["~/assets/css/main.css"],

  colorMode: {
    preference: "light",
  },

  ssr: false,

  pwa: {
    registerType: "autoUpdate", // Install updates automatically; the new service worker activates and reloads once in the background
    manifest: {
      name: "COPAMS",
      short_name: "COPAMS",
      description: "Offline-first attendance management system.",
      theme_color: "#F4F5F1",
      background_color: "#F4F5F1",
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
      // "autoUpdate" swaps in a new service worker as soon as it is installed.
      // These two flags make that swap immediate rather than waiting for every
      // old tab to close: the new worker claims open clients and activates.
      // Old JWTs keep working because the token lives in a cookie, not in the
      // precached bundle, and export/API routes are unchanged by a rebuild.
      skipWaiting: true,
      clientsClaim: true,

      // Precache the app shell as well as the scanner sounds and locally bundled fonts.
      globPatterns: [
        "**/*.{js,css,html,png,svg,ico,mp3,woff2,woff,webmanifest}",
      ],
      // Increase the file size limit to 3MB just in case your bundled assets get large
      maximumFileSizeToCacheInBytes: 3000000,
      // Remove stale precache entries when a new service worker is installed.
      cleanupOutdatedCaches: true,
      // Cache one copy of the SPA shell so the navigation fallback has a real
      // precached URL to serve. A fresh revision is generated for each build.
      additionalManifestEntries: [
        {
          url: "/scanner",
          revision: Date.now().toString(),
        },
      ],

      // Safe read-only API responses: use the network first, then fall back to
      // the last good response when offline or after a short timeout.
      runtimeCaching: [
        {
          urlPattern:
            /^https?:\/\/[^/]+\/(?:.*\/)?api\/events\/active(?:\?.*)?$/,
          method: "GET",
          handler: "NetworkFirst",
          options: {
            cacheName: "api-events-active",
            networkTimeoutSeconds: 4,
            expiration: {
              maxEntries: 1,
              maxAgeSeconds: 60 * 60 * 24,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // The admin roster is mutated by generate/publish and must never be
          // served from a stale offline copy. Ushers only need my-duty offline.
          urlPattern:
            /^https?:\/\/[^/]+\/(?:.*\/)?api\/roster\/[^/?]+\/my-duty(?:\?.*)?$/,
          method: "GET",
          handler: "NetworkFirst",
          options: {
            cacheName: "api-my-duty",
            networkTimeoutSeconds: 4,
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 12,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],

      // Serve the precached SPA shell for navigation requests when offline.
      navigateFallback: "/scanner",
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
