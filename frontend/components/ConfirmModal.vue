<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center px-4 sm:px-0"
    >
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        @click="respond(false)"
      ></div>

      <Transition name="scale">
        <div
          v-if="isOpen"
          class="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden text-center"
        >
          <div class="p-8">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              :class="
                isDestructive
                  ? 'bg-red-50 text-red-600'
                  : 'bg-blue-50 text-blue-600'
              "
            >
              <Icon
                :name="
                  isDestructive
                    ? 'material-symbols:warning'
                    : 'material-symbols:help'
                "
                class="text-3xl"
              />
            </div>

            <h3 class="text-xl font-black font-poppins text-gray-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-500 font-medium leading-relaxed">
              {{ message }}
            </p>
          </div>

          <div class="flex items-center border-t border-gray-100 bg-gray-50">
            <button
              @click="respond(false)"
              class="flex-1 py-4 text-sm font-bold font-poppins text-gray-500 hover:bg-gray-100 transition-colors border-r border-gray-100 outline-none"
            >
              {{ cancelText }}
            </button>
            <button
              @click="respond(true)"
              class="flex-1 py-4 text-sm font-bold font-poppins transition-colors outline-none"
              :class="
                isDestructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-blue-600 hover:bg-blue-50'
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
import { useConfirm } from "~/composables/useConfirm";

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
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
