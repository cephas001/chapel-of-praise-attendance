<template>
  <div
    class="min-h-screen bg-canvas font-sans text-ink lg:grid lg:grid-cols-[5fr_7fr]"
  >
    <section
      class="flex flex-col justify-between bg-ink px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12"
    >
      <div class="flex items-center gap-2.5">
        <span class="text-[15px] font-semibold uppercase tracking-[0.08em]">
          COPAMS
        </span>
      </div>

      <div class="mt-14 max-w-sm lg:mt-0">
        <p class="font-mono text-[11px] leading-4 text-white/50">
          chapel of praise
        </p>
        <h1 class="led-display mt-3 text-[34px] text-white sm:text-[42px]">
          Attendance, taken with ease.
        </h1>
        <p class="mt-4 text-sm leading-relaxed text-white/65">
          Ushers scan anywhere. The records stays on the device and syncs when
          the network returns.
        </p>
      </div>

      <p class="mt-12 font-mono text-[11px] text-white/40">supports offline</p>
    </section>

    <section class="flex items-center px-6 py-10 sm:px-10 lg:px-16">
      <div class="w-full max-w-sm">
        <p class="led-eyebrow">access</p>
        <h2 class="led-display mt-2 text-[30px]">Sign in</h2>
        <p class="mt-2 text-sm leading-relaxed text-muted">
          Use your Google account, or the email and password issued to you.
        </p>

        <div class="mt-8">
          <button
            @click="triggerGoogleLogin"
            type="button"
            :disabled="isGoogleLoading || isLoading"
            class="led-btn led-btn-quiet w-full"
          >
            <Icon
              v-if="isGoogleLoading"
              name="material-symbols:sync"
              class="animate-spin text-lg"
            />
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div class="mt-6 flex items-center gap-4">
            <span class="h-px flex-1 bg-rule"></span>
            <span class="led-eyebrow shrink-0">or use email</span>
            <span class="h-px flex-1 bg-rule"></span>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="mt-6 space-y-5">
          <div>
            <label for="email" class="led-eyebrow mb-2 block">email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="led-field"
            />
          </div>

          <div>
            <label for="password" class="led-eyebrow mb-2 block"
              >password</label
            >
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                autocomplete="current-password"
                class="led-field pr-12"
              />

              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition-colors hover:text-ink"
                :title="showPassword ? 'Hide password' : 'Show password'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
              >
                <Icon
                  :name="
                    showPassword
                      ? 'material-symbols:visibility-off'
                      : 'material-symbols:visibility'
                  "
                  class="text-lg"
                />
              </button>
            </div>
          </div>

          <div
            v-if="errorMessage"
            class="flex items-center gap-2.5 border-l-2 border-status-error bg-[#fdf0ef] p-3 text-status-error"
          >
            <Icon
              name="material-symbols:error"
              class="mb-0.15shrink-0 text-base"
            />
            <p class="text-xs leading-snug">{{ errorMessage }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading || isGoogleLoading"
            class="led-btn led-btn-primary w-full"
          >
            <span>{{ isLoading ? "Signing in…" : "Sign in" }}</span>
            <Icon
              v-if="isLoading"
              name="material-symbols:sync"
              class="animate-spin text-lg"
            />
          </button>
        </form>

        <p class="mt-6 text-xs leading-relaxed text-muted">
          Can't sign in? Contact a superadmin.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useRuntimeConfig } from "#imports";
import { useAuth } from "~/composables/useAuth";
import { useAppToast } from "~/composables/useAppToast";

const router = useRouter();
const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const { login, googleLogin } = useAuth();
const toast = useAppToast();

// Firebase is only needed for the Google popup. Keeping the SDK behind a
// cached dynamic import removes it from the initial page bundle entirely.
let firebaseAuthPromise = null;
const getFirebaseAuth = () => {
  if (!firebaseAuthPromise) {
    firebaseAuthPromise = Promise.all([
      import("firebase/app"),
      import("firebase/auth"),
    ])
      .then(([appModule, authModule]) => {
        const app = appModule.getApps().length
          ? appModule.getApp()
          : appModule.initializeApp({
              apiKey: runtimeConfig.public.firebaseApiKey,
              authDomain: runtimeConfig.public.firebaseAuthDomain,
              projectId: runtimeConfig.public.firebaseProjectId,
              storageBucket: runtimeConfig.public.firebaseStorageBucket,
              messagingSenderId: runtimeConfig.public.firebaseMessagingSenderId,
              appId: runtimeConfig.public.firebaseAppId,
            });

        return { auth: authModule.getAuth(app), authModule };
      })
      .catch((error) => {
        firebaseAuthPromise = null;
        throw error;
      });
  }

  return firebaseAuthPromise;
};

const showPassword = ref(false);
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const isGoogleLoading = ref(false);

onMounted(() => {
  if (route.query.auth_error) {
    errorMessage.value =
      route.query.auth_error.replace(/\+/g, " ") || "Authentication failed.";
    router.replace({ query: {} });
  }
});

const triggerGoogleLogin = async () => {
  isGoogleLoading.value = true;
  errorMessage.value = "";

  try {
    const { auth, authModule } = await getFirebaseAuth();

    // 1. Get the VIP pass from Firebase
    const provider = new authModule.GoogleAuthProvider();
    const result = await authModule.signInWithPopup(auth, provider);
    const firebaseToken = await result.user.getIdToken();

    // 2. Hand it to your composable! (No more manual fetches or cookies here)
    await googleLogin(firebaseToken);

    toast.success("Signed in successfully.");
    router.push("/scanner");
  } catch (err) {
    if (err?.code === "auth/popup-closed-by-user") {
      errorMessage.value = "Google sign-in was cancelled.";
    } else if (err?.code === "auth/popup-blocked") {
      errorMessage.value =
        "The Google sign-in popup was blocked. Allow popups and try again.";
    } else if (err?.message) {
      // If the error came from our backend (the composable threw it).
      errorMessage.value = err.message;

      // Ensure unauthorized Firebase sessions are cleared.
      try {
        const { auth, authModule } = await getFirebaseAuth();
        await authModule.signOut(auth);
      } catch (_) {
        // The Firebase SDK may not have loaded; nothing to sign out from.
      }
    } else {
      errorMessage.value = "Failed to connect to Google. Please try again.";
    }
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    await login(email.value.trim().toLowerCase(), password.value);
    router.push("/");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
