<template>
  <div
    role="region"
    aria-label="Notifications"
    aria-live="polite"
    class="pointer-events-none fixed bottom-[calc(3rem+env(safe-area-inset-bottom))] right-0 z-toast flex w-full max-w-sm flex-col gap-2 px-4 sm:bottom-8 sm:px-0 sm:pr-4"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="status"
        class="pointer-events-auto flex items-stretch border border-rule bg-surface shadow-lg"
      >
        <span class="w-[3px] shrink-0" :class="bars[toast.type]"></span>

        <div class="flex min-w-0 flex-1 items-start gap-3 px-4 py-3">
          <Icon
            :name="icons[toast.type]"
            class="mt-0.5 shrink-0 text-lg"
            :class="colors[toast.type]"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-tight text-ink">
              {{ toast.title }}
            </p>
            <p class="mt-0.5 text-xs leading-snug text-muted">
              {{ toast.message }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="remove(toast.id)"
          aria-label="Dismiss notification"
          class="flex w-11 shrink-0 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-ink"
        >
          <Icon name="material-symbols:close" class="text-lg" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useAppToast } from "~/composables/useAppToast";

const { toasts, remove } = useAppToast();

// Toasts borrow the same status tones as badges, so a red toast and a red
// badge always mean the same thing. A 3px rule carries the tone; the body
// stays on the same paper as the rest of the interface.
const bars = {
  success: "bg-status-success",
  error: "bg-status-error",
  info: "bg-status-info",
  warning: "bg-status-syncing",
};
const colors = {
  success: "text-status-success",
  error: "text-status-error",
  info: "text-status-info",
  warning: "text-status-syncing",
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
  transition:
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
