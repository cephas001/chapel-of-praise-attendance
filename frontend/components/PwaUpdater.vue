<template>
  <div
    v-if="$pwa?.needRefresh"
    class="fixed bottom-6 right-6 z-[100] animate-fade-in"
  >
    <div
      class="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-gray-800 min-w-[300px]"
    >
      <div class="flex items-center gap-3">
        <Icon
          name="material-symbols:system-update"
          class="text-2xl text-blue-400"
        />
        <div class="flex flex-col">
          <span
            class="text-xs font-bold uppercase tracking-widest text-blue-400"
            >Update Available</span
          >
          <span class="text-sm font-medium font-sans"
            >A new version of the scanner is ready.</span
          >
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <button
          @click="$pwa.updateServiceWorker()"
          class="flex-1 bg-white text-black py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
        >
          Update Now
        </button>
        <button
          @click="$pwa.cancelPrompt()"
          class="flex-1 bg-gray-900 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
