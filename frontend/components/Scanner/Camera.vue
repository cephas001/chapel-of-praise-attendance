<template>
  <div class="border border-rule bg-white">
    <div
      v-if="!isCameraActive"
      class="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8"
    >
      <button
        type="button"
        @click="startCamera"
        aria-label="Start camera scanner"
        class="flex h-14 w-14 shrink-0 items-center justify-center bg-ink text-white transition-colors hover:bg-black"
      >
        <Icon name="material-symbols:qr-code-scanner" class="text-2xl" />
      </button>
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-ink">Camera paused</h3>
        <p class="mt-1 max-w-sm text-sm leading-relaxed text-muted">
          Start the scanner when you want to scan. Leaving it paused saves the
          device's battery.
        </p>
      </div>
    </div>

    <div v-else class="relative bg-ink">
      <div class="absolute left-4 top-4 z-10">
        <div class="flex items-center gap-2 bg-ink/80 px-2.5 py-1.5">
          <span class="h-1.5 w-1.5 rounded-[1px] bg-status-error"></span>
          <span class="font-mono text-[11px] text-white">live camera</span>
        </div>
      </div>

      <div v-if="hasTorch" class="absolute right-3 top-3 z-10">
        <button
          type="button"
          @click="toggleTorch"
          class="flex h-11 w-11 items-center justify-center border border-white/20 bg-ink/80 text-white transition-colors hover:bg-ink"
          :title="isTorchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'"
          :aria-label="isTorchOn ? 'Turn flashlight off' : 'Turn flashlight on'"
          :aria-pressed="isTorchOn"
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

      <div class="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <button
          @click="stopCamera"
          class="led-btn border-white/40 bg-ink/85 text-white hover:bg-ink"
        >
          <Icon name="material-symbols:stop-circle" class="text-lg" />
          Stop camera
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, nextTick, watch } from "vue";
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
let pausedForVisibility = false;

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
      // Uses the native BarcodeDetector (when the browser exposes it) so
      // decoding runs in native code instead of the main-thread JS scanner.
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: [
        // Admin unlock codes are standard QR codes; student IDs stay 1D.
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    });
  }

  // FIXED: Removed the forced videoConstraints. The library will now automatically
  // select the most efficient native resolution for the rear camera.
  const config = {
    fps: 5,
    // A square, viewfinder-relative box decodes QR codes without making the
    // 1D barcode box too small on narrow phones.
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const edge = Math.max(
        140,
        Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72),
      );
      return { width: edge, height: edge };
    },
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
  pausedForVisibility = false;
  emit("cameraStateChanged", false);
};

// Stop decoding and mute the camera track while the user is in another app,
// then resume exactly where we left off when the page becomes visible again.
const pauseForVisibility = async () => {
  if (!isCameraActive.value) return;

  if (activeVideoTrack) activeVideoTrack.enabled = false;

  if (html5QrCode?.isScanning && html5QrCode.getState() === 2) {
    try {
      await html5QrCode.pause(true);
      pausedForVisibility = true;
    } catch (error) {
      console.warn("Failed to pause camera for background tab:", error);
    }
  }
};

const resumeFromVisibility = async () => {
  if (activeVideoTrack) activeVideoTrack.enabled = true;

  if (
    pausedForVisibility &&
    isCameraActive.value &&
    html5QrCode?.getState() === 3
  ) {
    try {
      await html5QrCode.resume();
    } catch (error) {
      console.warn("Failed to resume camera after background tab:", error);
    }
  }

  pausedForVisibility = false;
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "hidden") {
    pauseForVisibility();
  } else {
    resumeFromVisibility();
  }
};

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  () => props.forceStop,
  async (newVal) => {
    if (newVal && isCameraActive.value) {
      await stopCamera();
    }
  },
);

onBeforeUnmount(async () => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  await stopCamera();
});
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
</style>
