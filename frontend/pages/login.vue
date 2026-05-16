<template>
  <div
    class="min-h-screen bg-blue-50 font-sans flex items-center justify-center p-6 sm:p-12 relative overflow-hidden"
  >
    <div
      class="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-gray-200 opacity-40 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
      class="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-gray-200 opacity-40 rounded-full blur-3xl pointer-events-none"
    ></div>

    <section
      class="relative w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 z-10 transition-all duration-300"
    >
      <header class="mb-10 pt-10 text-center md:text-left">
        <h1
          class="font-poppins text-xl md:text-3xl text-black tracking-wide md:tracking-tight leading-none mb-3 uppercase font-bold"
        >
          Login to COPAMS
        </h1>
      </header>

      <div class="space-y-6 mb-6">
        <button
          @click="triggerGoogleLogin"
          type="button"
          :disabled="isGoogleLoading || isLoading"
          class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-md font-bold font-poppins text-sm hover:bg-gray-50 transition-all focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Icon v-if="isGoogleLoading" name="material-symbols:sync" class="animate-spin text-xl" />
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div class="relative flex items-center">
          <div class="flex-grow border-t border-gray-200"></div>
          <span class="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">Or continue with email</span>
          <div class="flex-grow border-t border-gray-200"></div>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-3">
          <label
            for="email"
            class="font-poppins font-bold text-[11px] text-black tracking-widest uppercase"
          >
            Email
          </label>
          <div class="relative group mt-1">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors"
            >
              <Icon name="material-symbols:alternate-email" class="text-lg" />
            </div>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full border-black border rounded-md py-3 pl-11 pr-4 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label
              for="password"
              class="font-poppins font-bold text-[11px] text-black tracking-widest uppercase"
            >
              Password
            </label>
          </div>
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors"
            >
              <Icon name="material-symbols:lock" class="text-lg" />
            </div>

            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="w-full border-black border rounded-md py-3 pl-11 pr-12 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
            />

            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black focus:text-black transition-colors outline-none"
              :title="showPassword ? 'Hide password' : 'Show password'"
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
          class="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100"
        >
          <div class="shrink-0 text-red-600">
            <Icon name="material-symbols:error" class="text-lg" />
          </div>
          <p class="text-xs font-montserrat text-red-700 leading-tight">
            {{ errorMessage }}
          </p>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="isLoading || isGoogleLoading"
            class="w-full bg-black text-white font-montserrat font-bold text-sm tracking-widest py-4 rounded-md shadow-md transition-all duration-200 hover:bg-gray-900 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
            style="background-image: linear-gradient(15deg, #000000, #222222)"
          >
            <span v-if="isLoading">AUTHENTICATING...</span>
            <span v-else>SIGN IN</span>

            <Icon
              v-if="isLoading"
              name="material-symbols:sync"
              class="text-lg animate-spin"
            />
            <Icon
              v-else
              name="material-symbols:arrow-forward"
              class="text-lg"
            />
          </button>
        </div>
      </form>

      <footer class="mt-10 text-center">
        <div
          class="inline-flex items-center gap-2 text-[10px] font-montserrat font-bold text-gray-400 uppercase tracking-widest"
        >
          <span>Chapel Attendance System</span>
          <span class="h-1 w-1 bg-gray-300 rounded-full"></span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useNuxtApp } from '#imports';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useAuth } from "~/composables/useAuth";
import { useAppToast } from '~/composables/useAppToast';

const router = useRouter();
const route = useRoute();
const { $auth } = useNuxtApp();
const { login, googleLogin } = useAuth(); // Import the new function!
const toast = useAppToast();

const showPassword = ref(false);
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const isGoogleLoading = ref(false);

onMounted(() => {
  if (route.query.auth_error) {
    errorMessage.value = route.query.auth_error.replace(/\+/g, ' ') || "Authentication failed.";
    router.replace({ query: {} });
  }
});

const triggerGoogleLogin = async () => {
  isGoogleLoading.value = true;
  errorMessage.value = "";
  
  const provider = new GoogleAuthProvider();

  try {
    // 1. Get the VIP pass from Firebase
    const result = await signInWithPopup($auth, provider);
    const firebaseToken = await result.user.getIdToken();

    // 2. Hand it to your composable! (No more manual fetches or cookies here)
    await googleLogin(firebaseToken);
    
    toast.success("Successfully logged in!");
    router.push("/scanner");

  } catch (err) {
    // If the error came from our backend (the composable threw it)
    if (err.message) {
      errorMessage.value = err.message;
      await signOut($auth); // Ensure unauthorized Firebase sessions are cleared
    } else if (err.code === 'auth/popup-closed-by-user') {
      errorMessage.value = "Google login was cancelled.";
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
    await login(
      email.value.trim().toLowerCase(),
      password.value.trim().toLowerCase(),
    );
    router.push("/");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>