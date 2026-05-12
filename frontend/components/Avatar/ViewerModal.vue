<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-3xl p-4 animate-fade-in"
      @click.self="$emit('close')"
    >
      <div class="relative animate-zoom-in flex flex-col items-center gap-4">
        <div
          class="w-72 h-72 sm:w-96 sm:h-96 rounded-full border-4 border-white shadow-2xl bg-gray-100 flex items-center justify-center overflow-hidden"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Expanded Profile"
            class="w-full h-full object-cover"
          />
          <span
            v-else
            class="text-6xl font-black text-gray-300 font-montserrat uppercase"
          >
            {{ fallbackInitials }}
          </span>
        </div>

        <button
          @click="$emit('close')"
          class="absolute -top-12 sm:top-0 right-0 sm:-right-12 p-2 bg-white/20 text-white hover:bg-white/40 rounded-full transition-colors z-50 backdrop-blur-md flex items-center justify-center"
        >
          <Icon name="material-symbols:close" class="text-xl" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
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

defineEmits(["close"]);
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
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
