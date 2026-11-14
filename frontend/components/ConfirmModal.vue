<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-4"
    >
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-ink/60"
        @click="respond(false)"
      ></div>

      <Transition name="scale">
        <div
          v-if="isOpen"
          ref="modalRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-message"
          tabindex="-1"
          class="relative z-10 w-full max-w-sm border border-rule bg-canvas"
        >
          <div class="px-5 py-5">
            <p class="led-eyebrow">
              {{ isDestructive ? "confirm removal" : "confirm" }}
            </p>
            <h3 id="confirm-modal-title" class="led-display mt-2 text-[24px]">
              {{ title }}
            </h3>
            <p
              id="confirm-modal-message"
              class="mt-2 text-sm leading-relaxed text-muted"
            >
              {{ message }}
            </p>
          </div>

          <div class="flex border-t border-rule">
            <button
              type="button"
              @click="respond(false)"
              class="min-h-12 flex-1 border-r border-rule text-sm font-medium text-muted transition-colors hover:bg-inset hover:text-ink"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              @click="respond(true)"
              class="min-h-12 flex-1 text-sm font-semibold transition-colors hover:bg-inset"
              :class="
                isDestructive
                  ? 'text-status-error'
                  : 'text-chapel hover:text-chapel-strong'
              "
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from "vue";
import { useConfirm } from "~/composables/useConfirm";
import { useModalA11y } from "~/composables/useModalA11y";

// The component just reads the state and fires the respond() function
const {
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive,
  respond,
} = useConfirm();

const modalRef = ref(null);

useModalA11y(isOpen, modalRef, {
  onClose: () => respond(false),
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
