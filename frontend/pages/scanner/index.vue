<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
    <main class="pt-8 p-6 lg:px-8 max-w-7xl mx-auto">
      <header
        class="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat"
          >
            Scanner
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            Mark attendance with ease and efficiency.
          </p>
        </div>
        <div class="flex items-center gap-3 font-poppins">
          <button
            @click="loadActiveEvents"
            :disabled="isLoadingEvents"
            class="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Refresh Events"
          >
            <Icon
              name="material-symbols:refresh"
              class="text-xl text-gray-700"
              :class="{ 'animate-spin': isLoadingEvents }"
            />
          </button>

          <span
            class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border"
            :class="
              isOnline
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            "
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="isOnline ? 'bg-green-600 animate-pulse' : 'bg-red-600'"
            ></span>
            {{ isOnline ? "System Online" : "System Offline" }}
          </span>
        </div>
      </header>

      <div
        class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-poppins"
      >
        <div class="lg:col-span-4 space-y-6">
          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div class="flex justify-between items-center mb-6">
              <h3
                class="text-sm font-bold uppercase tracking-widest font-montserrat text-black"
              >
                Select Event
              </h3>
              <Icon
                v-if="isLoadingEvents"
                name="material-symbols:sync"
                class="animate-spin text-gray-400"
              />
            </div>

            <div
              v-if="activeEvents.length === 0"
              class="text-sm font-medium text-gray-400 text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl"
            >
              {{
                isLoadingEvents
                  ? "Loading events..."
                  : "No active events found."
              }}
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="event in activeEvents"
                :key="event.id"
                @click="selectEvent(event.id)"
                class="w-full group flex items-center justify-between p-4 rounded-xl transition-all duration-200 text-left"
                :class="
                  selectedEventId === event.id
                    ? 'bg-gray-50 border border-black shadow-sm'
                    : 'bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50'
                "
              >
                <div class="flex flex-col">
                  <span class="text-sm tracking-wide text-black">{{
                    event.name
                  }}</span>
                  <span class="text-xs text-gray-500 mt-0.5">{{
                    new Date(event.date).toLocaleDateString()
                  }}</span>
                </div>
                <Icon
                  :name="
                    selectedEventId === event.id
                      ? 'material-symbols:check-circle'
                      : 'material-symbols:arrow-forward'
                  "
                  class="text-2xl transition-colors"
                  :class="
                    selectedEventId === event.id
                      ? 'text-black'
                      : 'text-gray-300 group-hover:text-gray-400'
                  "
                />
              </button>
            </div>
          </div>

          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div class="flex justify-between items-center mb-4">
              <span
                class="text-xs font-bold text-gray-400 uppercase tracking-widest"
                >Local Queue</span
              >
              <span
                v-if="isSyncing"
                class="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
              >
                <Icon
                  name="material-symbols:sync"
                  class="text-sm animate-spin"
                />
                Syncing
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p class="text-2xl font-black text-black font-montserrat">
                  {{ unsyncedQueue.length }}
                </p>
                <p
                  class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 font-poppins"
                >
                  Pending
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p class="text-2xl font-black text-red-600 font-montserrat">
                  {{ syncErrors.length }}
                </p>
                <p
                  class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1 font-poppins"
                >
                  Rejections
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-8 space-y-6">
          <div
            v-if="!selectedEventId"
            class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center h-[300px]"
          >
            <div
              class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400"
            >
              <Icon name="material-symbols:qr-code-scanner" class="text-3xl" />
            </div>
            <h2 class="text-xl font-black text-black font-montserrat mb-2">
              Awaiting Event Selection
            </h2>
            <p class="text-sm text-gray-500 font-medium max-w-xs">
              Please select an active event from the list on the left to
              initialize the scanning interface.
            </p>
          </div>

          <template v-else>
            <div
              v-if="eventStatus === 'SYNCING_PHASE'"
              class="w-full bg-orange-50 border border-orange-200 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center"
            >
              <div class="bg-orange-100 text-orange-700 p-4 rounded-full mb-6">
                <Icon
                  name="material-symbols:sync"
                  class="text-3xl animate-spin"
                />
              </div>
              <h2
                class="text-2xl font-black text-orange-900 font-montserrat mb-2"
              >
                {{ selectedEventName }}
              </h2>
              <h3
                class="text-sm font-bold text-orange-800 mb-4 uppercase tracking-widest"
              >
                Syncing in Progress
              </h3>
              <p
                class="text-sm text-orange-700 font-medium leading-relaxed max-w-md"
              >
                The system is synchronizing all devices to enforce attendance
                rules. Scanning is temporarily disabled.
              </p>
            </div>

            <div
              v-else-if="
                eventStatus === 'SIGN_IN_ACTIVE' ||
                eventStatus === 'SIGN_OUT_ACTIVE'
              "
              class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div class="relative bg-black border-b border-gray-100">
                <div class="absolute top-4 left-4 z-10">
                  <div
                    class="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/10"
                  >
                    <span
                      class="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                    ></span>
                    <span
                      class="text-[10px] font-bold text-white uppercase tracking-widest"
                      >Live Feed</span
                    >
                  </div>
                </div>
                <div
                  id="reader"
                  class="w-full min-h-[300px] sm:min-h-[400px]"
                ></div>
              </div>

              <div class="p-6 sm:p-8">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div>
                    <h2 class="text-xl font-bold text-black font-montserrat">
                      {{ selectedEventName }}
                    </h2>
                    <p class="text-sm text-gray-500 font-medium mt-1">
                      Phase:
                      <span class="font-bold text-black">{{
                        eventStatus.replace("_ACTIVE", "").replace("_", " ")
                      }}</span>
                    </p>
                  </div>
                  <div
                    class="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200"
                  >
                    Auto-Scan Active
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="eventStatus !== 'SYNCING_PHASE'"
              class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div class="flex items-center gap-3 mb-6 sm:mb-8">
                <div
                  class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 text-black"
                >
                  <Icon name="material-symbols:keyboard" class="text-2xl" />
                </div>
                <div>
                  <h3
                    class="text-sm font-bold uppercase tracking-widest text-black"
                  >
                    Manual Entry
                  </h3>
                  <p class="text-xs text-gray-500 font-medium">
                    Record attendance via ID
                  </p>
                </div>
              </div>
              <form
                @submit.prevent="handleManualSubmit"
                class="flex flex-col sm:flex-row gap-5"
              >
                <div class="flex-grow relative">
                  <input
                    v-model="manualMatric"
                    type="text"
                    placeholder="FT"
                    class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 placeholder:text-sm outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  :disabled="isManualSubmitting"
                  class="h-14 px-8 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 uppercase tracking-widest text-xs flex items-center justify-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon
                    v-if="isManualSubmitting"
                    name="material-symbols:sync"
                    class="animate-spin text-lg"
                  />
                  {{ isManualSubmitting ? "Verifying..." : "Verify Record" }}
                </button>
              </form>
            </div>
          </template>
        </div>
      </div>
    </main>

    <div
      v-if="scannedMatric && !scanWarning"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-bounce"
    >
      <div
        class="bg-black text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-gray-800"
      >
        <Icon
          name="material-symbols:check-circle"
          class="text-green-400 text-2xl"
        />
        <div class="flex flex-col">
          <span
            class="text-xs font-bold uppercase tracking-widest leading-tight"
            >Saved Locally</span
          >
          <span class="text-sm text-gray-300 font-medium mt-0.5 font-montserrat"
            >{{ scannedMatric }} has been queued.</span
          >
        </div>
      </div>
    </div>

    <div
      v-if="scanWarning"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-bounce"
    >
      <div
        class="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-red-500"
      >
        <Icon name="material-symbols:warning" class="text-white text-2xl" />
        <div class="flex flex-col">
          <span
            class="text-xs font-bold uppercase tracking-widest leading-tight"
            >Notice</span
          >
          <span
            class="text-sm text-white/90 font-medium mt-0.5 font-montserrat"
            >{{ scanWarning }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "~/utils/db";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const router = useRouter();
const { user, token, initAuth } = useAuth();

const eventStatus = ref("SIGN_IN_ACTIVE");
let pollInterval = null;
const manualMatric = ref("FT");
const scannedMatric = ref("");
const scanWarning = ref(null);
const syncErrors = ref([]);
const unsyncedQueue = ref([]);
const isOnline = ref(true);
const isSyncing = ref(false);
let html5QrCode = null;
const activeEvents = ref([]);
const selectedEventId = ref(null);

const isLoadingEvents = ref(false);
const isManualSubmitting = ref(false);

const selectedEventName = computed(() => {
  const event = activeEvents.value.find((e) => e.id === selectedEventId.value);
  return event ? event.name : "Active Event";
});

const loadActiveEvents = async () => {
  if (!isOnline.value) return;
  isLoadingEvents.value = true;
  try {
    const data = await useApiFetch("/events/active");
    activeEvents.value = data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error("Failed to load events", error);
  } finally {
    isLoadingEvents.value = false;
  }
};

const loadQueue = async () => {
  const records = await db.unsynced_scans.toArray();
  unsyncedQueue.value = records.reverse();
};

const syncRecords = async () => {
  if (isSyncing.value || unsyncedQueue.value.length === 0 || !isOnline.value)
    return;

  isSyncing.value = true;
  const recordsToProcess = [...unsyncedQueue.value];

  for (const record of recordsToProcess) {
    try {
      await useApiFetch("/attendance/scan", {
        method: "POST",
        body: {
          event_id: selectedEventId.value,
          usher_id: user.value.id,
          matric_number: record.matric_number,
          scan_type: record.scan_type,
          scanned_at: record.timestamp,
        },
      });

      // If successful (no error thrown), delete from local DB
      await db.unsynced_scans.delete(record.id);
    } catch (error) {
      // Grab status from the Nuxt FetchError object
      const status = error.statusCode || error.response?.status;

      if (status === 409 || status === 403) {
        const errorData = error.data || {};
        syncErrors.value.unshift({
          id: Date.now() + Math.random(),
          matric: record.matric_number,
          message:
            errorData.message || errorData.error || "Rejected by server.",
        });

        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        await db.unsynced_scans.delete(record.id);
      } else {
        // Only break if it's a true network failure (500, network down, etc)
        console.error("Network died during sync loop:", error);
        break;
      }
    }
  }

  await loadQueue();
  isSyncing.value = false;
};

watch(isOnline, (newStatus) => {
  if (newStatus === true) syncRecords();
});

const handleScan = async (decodedText) => {
  scannedMatric.value = null;
  scanWarning.value = null;
  const cleanText = decodedText.trim().toUpperCase();
  const currentScanType =
    eventStatus.value === "SIGN_OUT_ACTIVE" ? "SIGN_OUT" : "SIGN_IN";

  try {
    const existingRecord = await db.unsynced_scans
      .where({ matric_number: cleanText, scan_type: currentScanType })
      .first();

    if (existingRecord) {
      scanWarning.value = `Duplicate: ${cleanText} is already in the queue.`;
      if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
      return;
    }

    await db.unsynced_scans.add({
      matric_number: cleanText,
      scan_type: currentScanType,
      timestamp: new Date().toISOString(),
    });

    scannedMatric.value = cleanText;
    await loadQueue();
    if (navigator.vibrate) navigator.vibrate(200);
    if (isOnline.value) syncRecords();
  } catch (error) {
    console.error("Local DB Error:", error);
  }
};

const handleManualSubmit = async () => {
  if (manualMatric.value) {
    isManualSubmitting.value = true;
    await handleScan(manualMatric.value);
    manualMatric.value = "";
    isManualSubmitting.value = false;
  }
};

const startCamera = () => {
  if (!document.getElementById("reader")) return;
  html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode
    .start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        if (html5QrCode.isScanning) {
          html5QrCode.pause(true);
          handleScan(decodedText).then(() =>
            setTimeout(() => {
              if (html5QrCode.isScanning) html5QrCode.resume();
            }, 1500),
          );
        }
      },
      (err) => {},
    )
    .catch((err) => console.log("Camera not detected/permitted"));
};

const checkEventStatus = async () => {
  if (!isOnline.value || !selectedEventId.value) return;
  try {
    const data = await useApiFetch(`/events/${selectedEventId.value}/status`);
    if (data.status === "SYNCING_PHASE" && html5QrCode?.isScanning) {
      html5QrCode.stop().catch((e) => console.error(e));
    }
    eventStatus.value = data.status;
  } catch (error) {
    console.error("Failed to check event status:", error);
  }
};

watch(eventStatus, async (newStatus, oldStatus) => {
  if (
    oldStatus === "SYNCING_PHASE" &&
    (newStatus === "SIGN_IN_ACTIVE" || newStatus === "SIGN_OUT_ACTIVE")
  ) {
    await nextTick();
    startCamera();
  }
});

const selectEvent = async (eventId) => {
  selectedEventId.value = eventId;
  await nextTick();
  startCamera();
  checkEventStatus();
  pollInterval = setInterval(checkEventStatus, 10000);
};

onMounted(() => {
  initAuth();
  if (!token.value) return router.push("/login");

  isOnline.value = navigator.onLine;
  window.addEventListener("online", () => {
    isOnline.value = true;
  });
  window.addEventListener("offline", () => {
    isOnline.value = false;
  });

  loadQueue().then(() => {
    if (isOnline.value) syncRecords();
  });

  loadActiveEvents();
});

onBeforeUnmount(() => {
  if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop();
  window.removeEventListener("online", () => {
    isOnline.value = true;
  });
  window.removeEventListener("offline", () => {
    isOnline.value = false;
  });
  if (pollInterval) clearInterval(pollInterval);
});
</script>
