<template>
  <div v-if="event">
    <section
      class="bg-white rounded-none p-6 sm:p-8 border border-rule relative overflow-hidden"
    >
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10"
      >
        <div>
          <h2 class="text-lg font-semibold font-sans text-ink">
            {{ event.name }}
          </h2>
          <p class="text-xs text-muted font-medium font-mono mt-1">
            Current State:
            <span
              class="inline-flex items-center rounded-[2px] text-xs font-semibold text-ink ml-1"
            >
              {{ getEventStatus(event.status).label }}
            </span>
          </p>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="handleStatus('ARCHIVED')"
            :disabled="!canTransitionTo('ARCHIVED') || isUpdating"
            class="bg-inset border border-rule px-4 py-2.5 rounded-md font-semibold font-sans text-sm hover:bg-inset transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="material-symbols:archive" class="text-lg" />
            <span class="hidden sm:inline">Archive</span>
          </button>

          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="bg-[#fdf0ef] text-status-error border border-[#e3b6b2] px-4 py-2.5 rounded-md font-semibold font-sans text-sm hover:bg-[#f7e3e0] transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Icon
              v-if="isDeleting"
              name="material-symbols:sync"
              class="text-lg animate-spin"
            />
            <Icon v-else name="material-symbols:delete" class="text-lg" />
            <span class="hidden sm:inline">Delete</span>
          </button>

          <button
            type="button"
            @click="handleExport"
            :disabled="isExporting"
            aria-label="Export attendance CSV"
            :aria-busy="isExporting"
            class="bg-white border border-rule text-ink px-5 py-2.5 rounded-md font-semibold font-sans text-sm hover:border-ink hover:bg-inset transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Icon
              :name="
                isExporting
                  ? 'material-symbols:sync'
                  : 'material-symbols:download'
              "
              class="text-lg"
              :class="{ 'animate-spin': isExporting }"
            />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <button
          @click="handleStatus('SIGN_IN_ACTIVE')"
          :disabled="!canTransitionTo('SIGN_IN_ACTIVE') || isUpdating"
          class="flex flex-col items-center justify-center px-6 pt-6 pb-8 bg-inset rounded-md border border-rule hover:border-ink transition-colors duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-[2px] flex items-center justify-center mb-4 transition-colors duration-200 text-status-live group-hover:bg-status-live group-hover:text-white group-disabled:text-muted"
          >
            <Icon name="material-symbols:login" class="text-xl" />
          </div>
          <span class="text-sm font-semibold font-mono text-ink">Sign in</span>
        </button>

        <button
          @click="handleStatus('SYNCING_PHASE')"
          :disabled="!canTransitionTo('SYNCING_PHASE') || isUpdating"
          class="flex flex-col items-center justify-center px-6 pt-6 pb-8 bg-inset rounded-md border border-rule hover:border-ink transition-colors duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-[2px] flex items-center justify-center mb-4 transition-colors duration-200 text-status-syncing group-hover:bg-status-syncing group-hover:text-white group-disabled:text-muted"
          >
            <Icon name="material-symbols:sync" class="text-xl" />
          </div>
          <span class="text-sm font-semibold font-mono text-ink"
            >Lock and sync</span
          >
        </button>

        <button
          @click="handleStatus('SIGN_OUT_ACTIVE')"
          :disabled="!canTransitionTo('SIGN_OUT_ACTIVE') || isUpdating"
          class="flex flex-col items-center justify-center px-6 pt-6 pb-8 bg-inset rounded-md border border-rule hover:border-ink transition-colors duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-[2px] flex items-center justify-center mb-4 transition-colors duration-200 text-status-locked group-hover:bg-status-locked group-hover:text-white group-disabled:text-muted"
          >
            <Icon name="material-symbols:logout" class="text-xl" />
          </div>
          <span class="text-sm font-semibold font-mono text-ink">Sign out</span>
        </button>
      </div>

      <div class="mt-8 pt-8 border-t border-rule relative z-10">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h3 class="flex items-center gap-2 text-sm font-semibold font-sans text-ink">
            <Icon
              name="material-symbols:lock-person"
              class="text-lg text-muted"
            />
            Access Code
          </h3>

          <InfoHint
            label="About access codes"
            text="Ushers cannot access the scanner interface until they scan this QR code or manually enter the PIN below. Do not share this outside the venue."
          />
        </div>

        <div
          class="bg-ink rounded-none px-6 py-8 flex flex-col md:flex-row items-center gap-6 justify-between"
        >
          <div class="text-left text-white">
            <div
              class="inline-flex items-center gap-3 bg-ink/50 border border-white/10 px-4 py-2 rounded-[2px]"
            >
              <span class="text-gray-300 text-xs font-medium"> PIN</span>
              <span
                class="font-mono font-medium text-xl tracking-widest text-chapel-soft"
                >{{ event.unlock_pin }}</span
              >
            </div>
          </div>

          <div class="bg-white p-2 shrink-0 border border-rule">
            <img
              v-if="unlockQrDataUrl"
              :src="unlockQrDataUrl"
              alt="QR code containing this event's unlock PIN"
              width="128"
              height="128"
              class="w-32 h-32 rounded-md"
            />
            <div
              v-else
              class="w-32 h-32 grid place-items-center text-center text-[11px] leading-snug text-muted"
            >
              QR unavailable — use the PIN
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import QRCode from "qrcode";
import {
  getEventStatus,
  canTransitionEventStatus,
} from "~/composables/useStatus";
import { useAppToast } from "~/composables/useAppToast";

// Large exports stream from the server and can take much longer than a normal
// API call, so give them their own ceiling and never retry a partial download.
const CSV_EXPORT_TIMEOUT_MS = 120_000;

const props = defineProps({
  event: Object,
});

const emit = defineEmits(["statusUpdated", "eventDeleted"]);

const toast = useAppToast();

const isUpdating = ref(false);
const isDeleting = ref(false);
const isExporting = ref(false);

const canTransitionTo = (targetStatus) =>
  canTransitionEventStatus(props.event?.status, targetStatus);

// The unlock PIN used to be embedded in a third-party QR-image URL, which sent
// the secret to an external service and into its logs. Render the QR locally.
const unlockQrDataUrl = ref("");

watch(
  () => props.event?.unlock_pin,
  async (pin) => {
    unlockQrDataUrl.value = "";

    if (!pin) return;

    try {
      unlockQrDataUrl.value = await QRCode.toDataURL(String(pin), {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
        color: { dark: "#0e1210", light: "#ffffff" },
      });
    } catch (error) {
      console.error("Could not render the unlock QR code:", error);
    }
  },
  { immediate: true },
);

const handleStatus = async (newStatus) => {
  isUpdating.value = true;
  emit("statusUpdated", props.event, newStatus, () => {
    isUpdating.value = false;
  });
};

const handleExport = async () => {
  isExporting.value = true;

  try {
    const blob = await useApiFetch(`/events/${props.event.id}/export`, {
      responseType: "blob",
      timeout: CSV_EXPORT_TIMEOUT_MS,
      // A GET download is idempotent, but a retry after a long timeout would
      // duplicate a large transfer, so let the user retry deliberately.
      retry: false,
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `attendance_report_${props.event.id}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    toast.error(error.data?.error || "Couldn't export the attendance report.");
  } finally {
    isExporting.value = false;
  }
};

const handleDelete = async () => {
  isDeleting.value = true;
  emit("eventDeleted", props.event.id, () => {
    isDeleting.value = false;
  });
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 180ms ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
