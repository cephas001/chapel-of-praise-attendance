<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-montserrat pb-24">
    <main class="pt-10 p-6 lg:px-8 max-w-7xl mx-auto">
      <header class="mb-10 sm:mb-12">
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat"
          >
            Welcome
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            Chapel of Praise Attendance Management System
          </p>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div
          class="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm hover:border-black transition-all duration-200 group flex flex-col"
        >
          <div class="flex items-center gap-4 mb-4">
            <div
              class="bg-green-50 text-green-600 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-200 flex items-center justify-center"
            >
              <Icon name="material-symbols:qr-code-scanner" class="text-2xl" />
            </div>
            <h3 class="text-xl font-black text-black">Attendance Scanner</h3>
          </div>

          <p class="text-md text-gray-500 mb-8 leading-relaxed grow">
            Initialize the offline-first scanning module to record event
            presence and manage the synchronization queue.
          </p>

          <div class="flex flex-col sm:flex-row gap-3 mt-auto">
            <NuxtLink
              to="/scanner"
              class="w-full bg-black text-white text-center py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Icon name="material-symbols:play-arrow" class="text-lg" />
              Launch Scanner
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";

const { user, initAuth } = useAuth();

onMounted(() => {
  initAuth();
});
</script>
