<template>
  <div
    class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
  >
    <div
      v-if="!isCameraActive"
      class="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gray-50 border-b border-gray-100 min-h-[300px]"
    >
      <button
        @click="startCamera"
        class="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mb-6 shadow-xl hover:scale-105 transition-all duration-200 border-4 border-gray-200 hover:border-gray-300"
      >
        <Icon name="material-symbols:qr-code-scanner" class="text-4xl" />
      </button>
      <h3 class="text-lg font-black text-black font-montserrat mb-2">
        Camera Paused
      </h3>
      <p class="text-sm text-gray-500 font-medium max-w-xs">
        Tap the button to activate the scanner. Keeping the camera paused saves
        your device's battery and CPU.
      </p>
    </div>

    <div v-else class="relative bg-black border-b border-gray-100">
      <div class="absolute top-4 left-4 z-10">
        <div
          class="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/10"
        >
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span
            class="text-[10px] font-bold text-white uppercase tracking-widest"
            >Live Feed</span
          >
        </div>
      </div>

      <div v-if="hasTorch" class="absolute top-4 right-4 z-10 animate-fade-in">
        <button
          @click="toggleTorch"
          class="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-black/80 transition-colors shadow-lg active:scale-95"
          :title="isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'"
        >
          <Icon
            :name="
              isTorchOn
                ? 'material-symbols:flashlight-off'
                : 'material-symbols:flashlight-on'
            "
            class="text-xl"
            :class="isTorchOn ? 'text-yellow-400' : 'text-white'"
          />
        </button>
      </div>

      <div id="reader" class="w-full min-h-[300px] sm:min-h-[400px]"></div>

      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          @click="stopCamera"
          class="px-6 py-2.5 bg-red-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg border border-red-500 hover:bg-red-700 transition-colors flex items-center gap-2 active:scale-95"
        >
          <Icon name="material-symbols:stop-circle" class="text-lg" />
          Stop Scanner
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, nextTick, watch } from "vue";

const props = defineProps({
  forceStop: Boolean,
});

const emit = defineEmits(["scanned", "cameraStateChanged"]);

const isCameraActive = ref(false);
const hasTorch = ref(false);
const isTorchOn = ref(false);
let html5QrCode = null;
let activeVideoTrack = null; // NEW: Keep track of the actual hardware stream

const startCamera = async () => {
  isCameraActive.value = true;
  emit("cameraStateChanged", true);
  await nextTick();

  if (!document.getElementById("reader")) return;

  if (!html5QrCode) {
    const { Html5Qrcode } = await import("html5-qrcode");
    html5QrCode = new Html5Qrcode("reader");
  }

  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode
    .start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        if (html5QrCode.isScanning) {
          await stopCamera();
          emit("scanned", decodedText);
        }
      },
      (err) => {},
    )
    .then(() => {
      // NEW: Direct Hardware Polling
      setTimeout(() => {
        try {
          // Find the actual video element the library just created
          const videoElement = document.querySelector("#reader video");
          if (videoElement && videoElement.srcObject) {
            // Get the raw video track from the browser
            const track = videoElement.srcObject.getVideoTracks()[0];
            if (track) {
              activeVideoTrack = track;
              // Ask the browser directly if this specific track supports the 'torch' constraint
              const capabilities = track.getCapabilities();
              hasTorch.value = !!capabilities.torch;
            }
          }
        } catch (e) {
          console.log("Torch detection failed:", e);
          hasTorch.value = false;
        }
      }, 500); // Give the video element a half-second to fully mount
    })
    .catch((err) => {
      console.log("Camera not detected/permitted");
      isCameraActive.value = false;
      emit("cameraStateChanged", false);
      alert(
        "Unable to access the camera. Please check your browser permissions.",
      );
    });
};

const toggleTorch = async () => {
  if (!activeVideoTrack) return;

  try {
    const newState = !isTorchOn.value;
    // Apply the constraint directly to the browser's video track
    await activeVideoTrack.applyConstraints({
      advanced: [{ torch: newState }],
    });
    isTorchOn.value = newState;
  } catch (error) {
    console.error("Failed to toggle flashlight:", error);
    alert(
      "Your device blocked the flashlight request. Ensure your phone battery isn't too low.",
    );
  }
};

const stopCamera = async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    await html5QrCode.stop();
  }
  isCameraActive.value = false;
  isTorchOn.value = false;
  hasTorch.value = false;
  activeVideoTrack = null;
  emit("cameraStateChanged", false);
};

watch(
  () => props.forceStop,
  async (newVal) => {
    if (newVal && isCameraActive.value) {
      await stopCamera();
    }
  },
);

onBeforeUnmount(async () => {
  await stopCamera();
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
