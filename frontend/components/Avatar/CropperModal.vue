<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-modal flex items-center justify-center bg-ink/80 p-4"
    >
      <div
        ref="modalRef"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-picture-title"
        tabindex="-1"
        class="flex w-full max-w-md flex-col border border-rule bg-canvas"
      >
        <div
          class="flex items-center justify-between border-b border-rule px-5 py-4"
        >
          <h3 id="crop-picture-title" class="led-display text-[22px]">
            Crop picture
          </h3>
          <button
            type="button"
            @click="$emit('close')"
            aria-label="Close crop picture dialog"
            class="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-ink"
          >
            <Icon name="material-symbols:close" class="text-xl" />
          </button>
        </div>

        <div class="relative h-80 w-full bg-ink">
          <cropper
            ref="cropperRef"
            class="h-full w-full"
            :src="imageUrl"
            :stencil-component="CircleStencil"
            :stencil-props="{
              aspectRatio: 1,
            }"
            image-restriction="stencil"
          />
        </div>

        <div
          class="flex items-center justify-between gap-4 border-t border-rule px-5 py-4"
        >
          <p class="led-eyebrow">pinch to zoom, drag to move</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('close')"
              class="led-btn led-btn-quiet"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleCrop"
              class="led-btn led-btn-primary"
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
import { ref, toRef } from "vue";
import { Cropper, CircleStencil } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { useModalA11y } from "~/composables/useModalA11y";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  imageUrl: { type: String, required: true },
});

const emit = defineEmits(["close", "crop"]);
const isOpen = toRef(props, "isOpen");
const modalRef = ref(null);
const cropperRef = ref(null);

useModalA11y(isOpen, modalRef, {
  onClose: () => emit("close"),
});

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
  animation: fadeIn 180ms ease-out forwards;
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
