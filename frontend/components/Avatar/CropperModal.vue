<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div
        class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in flex flex-col"
      >
        <div
          class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"
        >
          <h3 class="text-lg font-black font-poppins text-black">
            Crop Picture
          </h3>
          <button
            @click="$emit('close')"
            class="p-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
          >
            <Icon name="material-symbols:close" class="text-xl" />
          </button>
        </div>

        <div class="w-full h-80 bg-gray-900 relative">
          <cropper
            ref="cropperRef"
            class="w-full h-full"
            :src="imageUrl"
            :stencil-component="CircleStencil"
            :stencil-props="{
              aspectRatio: 1,
            }"
            image-restriction="stencil"
          />
        </div>

        <div class="p-6 bg-gray-50 flex justify-between items-center">
          <p
            class="text-[10px] text-gray-500 font-bold uppercase tracking-widest"
          >
            Pinch to zoom / Drag to move
          </p>
          <div class="flex gap-3">
            <button
              @click="$emit('close')"
              class="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleCrop"
              class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  imageUrl: { type: String, required: true },
});

const emit = defineEmits(["close", "crop"]);
const cropperRef = ref(null);

const handleCrop = () => {
  if (cropperRef.value) {
    const { canvas } = cropperRef.value.getResult();
    if (canvas) {
      // Convert the canvas to a blob (a file-like object)
      canvas.toBlob(
        (blob) => {
          emit("crop", blob);
        },
        "image/jpeg",
        0.9,
      ); // Compress slightly to 90% quality for optimal storage
    }
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
