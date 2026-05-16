<template>
  <div
    class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
  >
    <div
      v-if="!isCameraActive"
      class="p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-gray-50 border-b border-gray-100 min-h-75"
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

      <div id="reader" class="w-full min-h-75 sm:min-h-100"></div>

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
import { useAppToast } from "~/composables/useAppToast";

const toast = useAppToast();
const props = defineProps({
  forceStop: Boolean,
});

const emit = defineEmits(["scanned", "cameraStateChanged"]);

const isCameraActive = ref(false);
const hasTorch = ref(false);
const isTorchOn = ref(false);

let html5QrCode = null;
let activeVideoTrack = null;
let isProcessing = false;
let isStarting = false;

let lastScannedText = "";
let lastScannedTime = 0;

const startCamera = async () => {
  if (isStarting) return;
  isStarting = true;

  isCameraActive.value = true;
  emit("cameraStateChanged", true);
  await nextTick();

  if (!document.getElementById("reader")) {
    isStarting = false;
    return;
  }

  if (!html5QrCode) {
    const { Html5Qrcode, Html5QrcodeSupportedFormats } =
      await import("html5-qrcode");
    html5QrCode = new Html5Qrcode("reader", {
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    });
  }

  // FIXED: Removed the forced videoConstraints. The library will now automatically
  // select the most efficient native resolution for the rear camera.
  const config = {
    fps: 5,
    qrbox: { width: 250, height: 150 },
  };

  try {
    // STRICTLY lock to the rear camera. No more front-camera fallbacks.
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        const now = Date.now();

        if (decodedText === lastScannedText && now - lastScannedTime < 2000)
          return;
        if (!html5QrCode.isScanning || isProcessing) return;

        isProcessing = true;
        lastScannedText = decodedText;
        lastScannedTime = now;

        html5QrCode.pause(true);
        if (navigator.vibrate) navigator.vibrate([200]);
        emit("scanned", decodedText);

        setTimeout(() => {
          if (html5QrCode && html5QrCode.getState() === 3) {
            html5QrCode.resume();
            isProcessing = false;
          }
        }, 400);
      },
      (err) => {}, // Ignore frame-by-frame read errors
    );

    isStarting = false;

    // Direct Hardware Polling for Torch
    setTimeout(() => {
      try {
        const videoElement = document.querySelector("#reader video");
        if (videoElement && videoElement.srcObject) {
          const track = videoElement.srcObject.getVideoTracks()[0];
          if (track) {
            activeVideoTrack = track;
            const capabilities = track.getCapabilities();
            hasTorch.value = !!capabilities.torch;
          }
        }
      } catch (e) {
        hasTorch.value = false;
      }
    }, 500);
  } catch (err) {
    console.error("Camera startup failed:", err);
    isStarting = false;
    isCameraActive.value = false;
    emit("cameraStateChanged", false);
    toast.error(
      "Unable to access the rear camera. Ensure permissions are granted and no other app is using it.",
    );
  }
};

const toggleTorch = async () => {
  if (!activeVideoTrack) return;
  try {
    const newState = !isTorchOn.value;
    await activeVideoTrack.applyConstraints({
      advanced: [{ torch: newState }],
    });
    isTorchOn.value = newState;
  } catch (error) {
    toast.error("Your device blocked the flashlight request.");
  }
};

const stopCamera = async () => {
  if (isStarting) return;

  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop();
    } catch (err) {
      console.warn("Failed to stop camera cleanly:", err);
    }
  }

  isCameraActive.value = false;
  isTorchOn.value = false;
  hasTorch.value = false;
  activeVideoTrack = null;
  isProcessing = false;
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
