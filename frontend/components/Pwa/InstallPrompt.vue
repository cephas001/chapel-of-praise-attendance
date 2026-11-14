<template>
  <div
    v-if="showPrompt"
    role="complementary"
    aria-label="Install COPAMS"
    class="fixed inset-x-0 bottom-4 z-install mx-auto w-[calc(100%-2rem)] max-w-sm animate-slide-up"
  >
    <div class="flex items-stretch border border-ink bg-ink text-white">
      <div class="flex w-11 shrink-0 items-center justify-center bg-white text-ink">
        <Icon name="material-symbols:token" class="text-lg" />
      </div>

      <div class="min-w-0 flex-1 px-4 py-3">
        <p class="text-[13px] font-semibold leading-tight">Install COPAMS</p>
        <p class="mt-0.5 truncate font-mono text-[11px] text-white/60">
          {{
            isIOS
              ? "share, then add to home screen"
              : "works offline, anywhere"
          }}
        </p>
      </div>

      <button
        v-if="!isIOS"
        type="button"
        @click="installApp"
        class="shrink-0 px-4 font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        install
      </button>

      <button
        type="button"
        @click="dismissPrompt"
        aria-label="Dismiss install prompt"
        class="flex w-11 shrink-0 items-center justify-center text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Icon name="material-symbols:close" class="text-lg" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAppToast } from "~/composables/useAppToast";
import { useAuth } from "~/composables/useAuth";
import { useOverlayState } from "~/composables/useOverlayState";

const route = useRoute();
const { token } = useAuth();
const { toasts } = useAppToast();
const { hasOverlay } = useOverlayState();

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const showPrompt = ref(false);
const deferredPrompt = ref(null);
const isIOS = ref(false);
const isStandalone = ref(false);
const isDismissed = ref(false);
let timer = null;

// Keep the install prompt away from the scanner: it must never cover the
// camera controls while an usher is working.
const canTrigger = computed(
  () =>
    Boolean(token.value) &&
    ["/inbox", "/profile"].includes(route.path) &&
    !hasOverlay.value &&
    toasts.value.length === 0 &&
    !isStandalone.value &&
    !isDismissed.value &&
    (isIOS.value || deferredPrompt.value),
);

watch(
  canTrigger,
  (eligible) => {
    if (timer) clearTimeout(timer);

    if (!eligible) {
      showPrompt.value = false;
      return;
    }

    timer = setTimeout(() => {
      if (canTrigger.value) showPrompt.value = true;
    }, 3000);
  },
  { immediate: true },
);

const handleBeforeInstallPrompt = (e) => {
  // Prevent the browser's automatic mini-infobar and keep the event so the
  // custom prompt can trigger it later.
  e.preventDefault();
  deferredPrompt.value = e;
};

const handleAppInstalled = () => {
  showPrompt.value = false;
  deferredPrompt.value = null;
  isStandalone.value = true;
};

const dismissPrompt = () => {
  showPrompt.value = false;
  isDismissed.value = true;

  // Do not show the prompt again for 7 days.
  localStorage.setItem(
    "pwa-dismissed-until",
    (Date.now() + SNOOZE_MS).toString(),
  );
};

const installApp = async () => {
  if (!deferredPrompt.value) return;

  deferredPrompt.value.prompt();

  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === "accepted") {
    showPrompt.value = false;
    isStandalone.value = true;
  }

  // A beforeinstallprompt event can only be used once.
  deferredPrompt.value = null;
};

onMounted(() => {
  if (!import.meta.client) return;

  isStandalone.value = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;

  const dismissedUntil = localStorage.getItem("pwa-dismissed-until");
  isDismissed.value =
    Boolean(dismissedUntil) && Date.now() < Number(dismissedUntil);

  const userAgent = window.navigator.userAgent.toLowerCase();
  isIOS.value = /iphone|ipad|ipod/.test(userAgent);

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;

  window.removeEventListener(
    "beforeinstallprompt",
    handleBeforeInstallPrompt,
  );
  window.removeEventListener("appinstalled", handleAppInstalled);
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
