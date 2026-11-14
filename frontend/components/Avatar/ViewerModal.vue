<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-modal flex items-center justify-center bg-ink p-4"
      @click.self="$emit('close')"
    >
      <div
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        aria-label="Profile picture preview"
        tabindex="-1"
        class="relative flex flex-col items-center"
      >
        <div
          class="flex h-72 w-72 items-center justify-center overflow-hidden border border-white/20 bg-white/5 text-white/60 sm:h-96 sm:w-96"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Expanded Profile"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-6xl font-medium uppercase">
            {{ fallbackInitials }}
          </span>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          aria-label="Close profile picture preview"
          class="absolute -right-2 -top-12 flex h-11 w-11 items-center justify-center border border-white/20 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="material-symbols:close" class="text-xl" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, toRef } from "vue";
import { useModalA11y } from "~/composables/useModalA11y";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  fallbackInitials: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);
const isOpen = toRef(props, "isOpen");
const modalRef = ref(null);

useModalA11y(isOpen, modalRef, {
  onClose: () => emit("close"),
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 180ms ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
