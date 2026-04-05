<template>
  <div class="max-w-md mx-auto p-4 flex flex-col items-center">
    <header
      class="w-full py-4 mb-4 border-b border-gray-200 flex justify-between items-center"
    >
      <div>
        <h1 class="text-xl font-bold text-blue-900">Chapel Attendance</h1>
        <p class="text-gray-500 text-xs">Offline Scanner & Manual Entry</p>
      </div>
      <div
        class="px-3 py-1 rounded-full text-xs font-bold transition-colors"
        :class="
          isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        "
      >
        <span v-if="isOnline" class="flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Online
        </span>
        <span v-else class="flex items-center gap-1">
          <span class="w-2 h-2 bg-red-500 rounded-full"></span> Offline
        </span>
      </div>
    </header>

    <div
      v-if="!selectedEventId"
      class="w-full bg-white rounded-xl shadow-md p-6 mb-6"
    >
      <h2 class="text-lg font-bold text-gray-800 mb-4">Select Event to Scan</h2>

      <div
        v-if="activeEvents.length === 0"
        class="text-sm text-gray-500 text-center py-4 border border-dashed rounded-lg"
      >
        No active events found. Please tell an admin to start a service.
      </div>

      <div v-else class="space-y-3">
        <button
          v-for="event in activeEvents"
          :key="event.id"
          @click="selectEvent(event.id)"
          class="w-full text-left p-4 rounded-lg border border-blue-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex justify-between items-center group"
        >
          <div>
            <div class="font-bold text-blue-900 group-hover:text-blue-700">
              {{ event.name }}
            </div>
            <div class="text-xs text-gray-500">
              {{ new Date(event.date).toLocaleDateString() }}
            </div>
          </div>
          <svg
            class="w-5 h-5 text-blue-400 group-hover:text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <div
      v-else-if="
        eventStatus === 'SIGN_IN_ACTIVE' || eventStatus === 'SIGN_OUT_ACTIVE'
      "
      class="w-full flex flex-col items-center"
    >
      <div
        class="mb-4 px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-200"
      >
        Phase: {{ eventStatus.replace("_ACTIVE", "").replace("_", " ") }}
      </div>

      <div
        id="reader"
        class="w-full max-w-[300px] rounded-xl overflow-hidden shadow-lg bg-black mb-4"
      ></div>

      <div class="w-full mb-6">
        <form @submit.prevent="handleManualSubmit" class="flex gap-2">
          <input
            v-model="manualMatric"
            type="text"
            placeholder="Enter Matric (e.g. 19/1234)"
            class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 uppercase"
            required
          />
          <button
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Add
          </button>
        </form>
      </div>
    </div>

    <div
      v-else-if="eventStatus === 'SYNCING_PHASE'"
      class="w-full bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-6 shadow-sm"
    >
      <h2 class="text-xl font-bold text-blue-800 mb-2">Syncing in Progress</h2>
      <p class="text-sm text-blue-600 mb-4">
        The system is synchronizing all devices to enforce attendance rules.
        Scanning is temporarily disabled.
      </p>
      <svg
        class="animate-spin h-8 w-8 text-blue-500 mx-auto"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>

    <div
      v-if="scannedMatric && !scanWarning"
      class="w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center shadow-sm mb-4"
      role="alert"
    >
      <span class="block text-sm">Saved Locally:</span>
      <strong class="font-bold text-xl">{{ scannedMatric }}</strong>
    </div>

    <div
      v-if="scanWarning"
      class="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center shadow-sm mb-4"
      role="alert"
    >
      <span class="block text-sm font-bold">{{ scanWarning }}</span>
    </div>

    <div
      v-if="syncErrors.length > 0"
      class="w-full bg-red-50 border-2 border-red-500 text-red-800 p-3 rounded-lg shadow-md mb-4"
    >
      <div
        class="flex justify-between items-center mb-2 border-b border-red-200 pb-2"
      >
        <span class="font-bold flex items-center gap-2">
          <svg
            class="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>
          Server Rejections ({{ syncErrors.length }})
        </span>
        <button
          @click="syncErrors = []"
          class="text-xs bg-red-200 hover:bg-red-300 px-2 py-1 rounded text-red-900 font-bold transition-colors"
        >
          Clear All
        </button>
      </div>

      <ul class="space-y-2 max-h-32 overflow-y-auto pr-1">
        <li
          v-for="err in syncErrors"
          :key="err.id"
          class="text-xs bg-white p-2 rounded border border-red-100 flex flex-col"
        >
          <span class="font-bold text-red-600 font-mono">{{ err.matric }}</span>
          <span class="text-gray-600 mt-1">{{ err.message }}</span>
        </li>
      </ul>
    </div>

    <div class="w-full bg-white rounded-lg shadow-md p-4">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-gray-700">Queue</h2>
        <div class="flex items-center gap-2">
          <span
            v-if="isSyncing"
            class="text-xs text-blue-500 font-bold animate-pulse"
            >Syncing...</span
          >
          <span
            class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full"
          >
            {{ unsyncedQueue.length }} pending
          </span>
        </div>
      </div>

      <ul class="divide-y divide-gray-200 max-h-48 overflow-y-auto">
        <li
          v-if="unsyncedQueue.length === 0"
          class="py-2 text-sm text-gray-500 text-center"
        >
          Queue is empty!
        </li>
        <li
          v-for="record in unsyncedQueue"
          :key="record.id"
          class="py-2 flex justify-between items-center text-sm"
        >
          <span class="font-mono font-medium">{{ record.matric_number }}</span>
          <span class="text-gray-400 text-xs">{{
            new Date(record.timestamp).toLocaleTimeString()
          }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "~/utils/db";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const API_URL = "http://localhost:5000/api/attendance/scan"; // Ensure this matches your backend port

const router = useRouter();
const { user, token, initAuth, logout } = useAuth();

// State
const eventStatus = ref("SIGN_IN_ACTIVE");
let pollInterval = null;
const manualMatric = ref("");
const scannedMatric = ref("");
const scanWarning = ref(null);
const syncErrors = ref([]);
const unsyncedQueue = ref([]);
const isOnline = ref(true);
const isSyncing = ref(false);
let html5QrCode = null;
const activeEvents = ref([]);
const selectedEventId = ref(null);

// Fetch active events from the server
const loadActiveEvents = async () => {
  if (!isOnline.value) return;
  try {
    const res = await fetch("http://localhost:5000/api/events/active");
    if (res.ok) {
      activeEvents.value = await res.json();
    }
  } catch (error) {
    console.error("Failed to load events", error);
  }
};

// --- QUEUE & SYNC LOGIC ---
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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({
          event_id: selectedEventId.value,
          usher_id: user.value.id,
          matric_number: record.matric_number,
          scan_type: record.scan_type,
          scanned_at: record.timestamp,
        }),
      });

      if (response.status === 201) {
        await db.unsynced_scans.delete(record.id);
      } else if (response.status === 409 || response.status === 403) {
        const errorData = await response.json();

        syncErrors.value.unshift({
          id: Date.now() + Math.random(),
          matric: record.matric_number,
          message: errorData.message || "Rejected by server.",
        });

        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        await db.unsynced_scans.delete(record.id);
      } else {
        console.error(
          `Server error for ${record.matric_number}: Status ${response.status}`,
        );
      }
    } catch (error) {
      console.error("Network died during sync loop:", error);
      break;
    }
  }

  await loadQueue();
  isSyncing.value = false;
};

watch(isOnline, (newStatus) => {
  if (newStatus === true) syncRecords();
});

// --- SCANNING LOGIC ---
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

const handleManualSubmit = () => {
  if (manualMatric.value) {
    handleScan(manualMatric.value);
    manualMatric.value = "";
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

// --- EVENT STATUS POLLING ---
const checkEventStatus = async () => {
  if (!isOnline.value || !selectedEventId.value) return;
  try {
    const res = await fetch(
      `http://localhost:5000/api/events/${selectedEventId.value}/status`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === "SYNCING_PHASE" && html5QrCode?.isScanning) {
        html5QrCode.stop().catch((e) => console.error(e));
      }
      eventStatus.value = data.status;
    }
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

// Runs when the usher picks an event from the UI
const selectEvent = async (eventId) => {
  selectedEventId.value = eventId;

  // FIX: Wait for Vue to render the <div id="reader"> before starting the camera
  await nextTick();

  startCamera();
  checkEventStatus();
  pollInterval = setInterval(checkEventStatus, 10000);
};

// --- LIFECYCLE ---
onMounted(() => {
  initAuth();

  if (!token.value) {
    return router.push("/login");
  }

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
  // FIX: startCamera() and checkEventStatus() are removed from here. They belong in selectEvent.
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
