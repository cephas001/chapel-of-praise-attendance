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

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="space-y-3">
          <label
            for="username"
            class="font-poppins font-bold text-[11px] text-black tracking-widest uppercase"
          >
            Username
          </label>
          <div class="relative group mt-1">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors"
            >
              <Icon name="material-symbols:alternate-email" class="text-lg" />
            </div>
            <input
              id="username"
              v-model="username"
              type="text"
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
            :disabled="isLoading"
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const router = useRouter();
const { login } = useAuth();

const showPassword = ref(false);
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    await login(username.value.trim(), password.value.trim());
    // If successful, push them to the scanner page!
    router.push("/");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
