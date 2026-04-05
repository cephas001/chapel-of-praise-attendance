<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div
      class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100"
    >
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-blue-900 mb-2">Chapel Attendance</h1>
        <p class="text-gray-500 text-sm">Sign in to access your scanner</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1"
            >Username</label
          >
          <input
            v-model="username"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1"
            >Password</label
          >
          <input
            v-model="password"
            type="password"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div
          v-if="errorMessage"
          class="text-red-600 text-sm font-bold text-center bg-red-50 py-2 rounded"
        >
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {{ isLoading ? "Authenticating..." : "Sign In" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const router = useRouter();
const { login } = useAuth();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    await login(username.value, password.value);
    // If successful, push them to the scanner page!
    router.push("/");
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
