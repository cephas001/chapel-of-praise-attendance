<template>
  <div
    class="fixed bottom-10 right-0 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto overflow-hidden rounded-xl shadow-xl border bg-white flex items-stretch"
        :class="borderColors[toast.type]"
      >
        <div
          class="p-4 flex items-center justify-center shrink-0"
          :class="bgColors[toast.type]"
        >
          <Icon
            :name="icons[toast.type]"
            class="text-2xl"
            :class="iconColors[toast.type]"
          />
        </div>

        <div class="py-3 px-4 flex-grow flex flex-col justify-center">
          <h4
            class="text-sm font-black font-poppins text-gray-900 leading-tight"
          >
            {{ toast.title }}
          </h4>
          <p class="text-xs text-gray-500 font-medium mt-0.5 leading-snug">
            {{ toast.message }}
          </p>
        </div>

        <button
          @click="remove(toast.id)"
          class="px-4 text-gray-400 hover:text-black transition-colors focus:outline-none"
        >
          <Icon name="material-symbols:close" class="text-lg" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from "~/composables/useToast";

const { toasts, remove } = useToast();

// Dictionaries to map the toast 'type' to specific Tailwind classes
const borderColors = {
  success: "border-green-200",
  error: "border-red-200",
  info: "border-blue-200",
  warning: "border-orange-300", // NEW
};
const bgColors = {
  success: "bg-green-50",
  error: "bg-red-50",
  info: "bg-blue-50",
  warning: "bg-orange-50", // NEW
};
const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-blue-600",
  warning: "text-orange-600", // NEW
};
const icons = {
  success: "material-symbols:check-circle",
  error: "material-symbols:error",
  info: "material-symbols:info",
  warning: "material-symbols:notifications-active", // NEW: Rings a bell for broadcasts
};
</script>

<style scoped>
/* Smooth slide-in-from-right animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9); /* Slides out to the right */
}
/* This ensures other toasts smoothly slide up when one is removed */
.toast-move {
  transition: transform 0.4s ease;
}
</style>
