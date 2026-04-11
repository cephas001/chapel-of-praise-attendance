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
            <h3
              class="text-sm font-bold uppercase tracking-widest font-montserrat text-black mb-6"
            >
              Select Event
            </h3>
            <div
              v-if="activeEvents.length === 0"
              class="text-sm text-gray-400 text-center py-6 bg-gray-50 border border-dashed rounded-xl"
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
                class="w-full flex justify-between p-4 rounded-xl text-left border hover:bg-gray-50"
                :class="
                  selectedEventId === event.id
                    ? 'bg-gray-50 border-black shadow-sm'
                    : 'border-transparent'
                "
              >
                <div class="flex flex-col">
                  <span class="text-sm text-black">{{ event.name }}</span>
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
                  class="text-2xl"
                  :class="
                    selectedEventId === event.id
                      ? 'text-black'
                      : 'text-gray-300'
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
                  class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1"
                >
                  Pending
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p class="text-2xl font-black text-red-600 font-montserrat">
                  {{ syncErrors.length }}
                </p>
                <p
                  class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1"
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
            <p class="text-sm text-gray-500 max-w-xs">
              Please select an active event to initialize the scanner.
            </p>
          </div>

          <template v-else>
            <div
              v-if="eventStatus === 'SYNCING_PHASE'"
              class="bg-orange-50 border border-orange-200 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center"
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
              <p class="text-sm text-orange-700 max-w-md">
                The system is synchronizing all devices. Scanning is temporarily
                disabled.
              </p>
            </div>

            <div
              v-else-if="
                eventStatus === 'SIGN_IN_ACTIVE' ||
                eventStatus === 'SIGN_OUT_ACTIVE'
              "
              class="bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <ScannerCamera
                :forceStop="forceKillCamera"
                @scanned="handleScan"
                @cameraStateChanged="isCameraActive = $event"
              />

              <div class="p-6 sm:p-8">
                <div
                  class="flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div>
                    <h2 class="text-xl font-bold text-black font-montserrat">
                      {{ selectedEventName }}
                    </h2>
                    <p class="text-sm text-gray-500 mt-1">
                      Phase:
                      <span class="font-bold text-black">{{
                        eventStatus.replace("_ACTIVE", "").replace("_", " ")
                      }}</span>
                    </p>
                  </div>
                  <div
                    class="px-4 py-2 bg-gray-50 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-200 flex items-center gap-2"
                  >
                    <span
                      class="w-2 h-2 rounded-full"
                      :class="
                        isCameraActive
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-400'
                      "
                    ></span>
                    {{ isCameraActive ? "Scanning..." : "Standing By" }}
                  </div>
                </div>

                <div
                  v-if="scannedMatric || scanWarning"
                  class="mt-5 animate-fade-in flex"
                >
                  <div
                    class="flex items-center gap-2.5 px-4 py-2 rounded-lg border text-xs font-semibold tracking-wide font-poppins"
                    :class="
                      scanWarning
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-black border-black text-white shadow-sm'
                    "
                  >
                    <Icon
                      :name="
                        scanWarning
                          ? 'material-symbols:error'
                          : 'material-symbols:check-circle'
                      "
                      class="text-base shrink-0"
                      :class="scanWarning ? 'text-red-500' : 'text-green-400'"
                    />
                    <span class="truncate">
                      <span
                        v-if="!scanWarning"
                        class="text-gray-400 font-normal mr-1"
                        >Logged:</span
                      >
                      {{ scanWarning ? scanWarning : scannedMatric }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="eventStatus !== 'SYNCING_PHASE'"
              class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div class="flex items-center gap-3 mb-6">
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
                </div>
              </div>
              <form
                @submit.prevent="submitManual"
                class="flex flex-col sm:flex-row gap-5"
              >
                <input
                  v-model="manualMatric"
                  type="text"
                  placeholder="FT"
                  required
                  class="flex-grow border-gray-400 focus:border-black border rounded-md py-3 px-4 text-black outline-none transition-all"
                />
                <button
                  type="submit"
                  :disabled="isManualSubmitting"
                  class="h-14 px-8 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50"
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
      <div v-if="unsyncedQueue.length > 0" class="mt-8 animate-fade-in">
        <section
          class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div
            class="p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50"
          >
            <div>
              <h2
                class="text-lg font-black font-poppins flex items-center gap-2 text-black"
              >
                <Icon name="material-symbols:database" class="text-xl" />
                Local Storage Inspector
              </h2>
              <p class="text-xs text-gray-500 font-medium mt-1">
                These records are saved on this device and waiting for a network
                connection.
              </p>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <button
                @click="clearQueue"
                class="flex-1 md:flex-none px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="material-symbols:delete-sweep" class="text-lg" />
                Clear Queue
              </button>

              <button
                @click="syncRecords"
                :disabled="isSyncing || !isOnline"
                class="flex-1 md:flex-none px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                <Icon
                  v-if="isSyncing"
                  name="material-symbols:sync"
                  class="text-lg animate-spin"
                />
                <Icon
                  v-else
                  name="material-symbols:cloud-upload"
                  class="text-lg"
                />
                {{ isSyncing ? "Syncing..." : "Force Sync" }}
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-bold text-gray-400 font-poppins"
                >
                  <th class="p-4 pl-6 sm:pl-8 font-medium">Matric Number</th>
                  <th class="p-4 font-medium">Scan Type</th>
                  <th class="p-4 pr-6 sm:pr-8 font-medium text-right">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="record in unsyncedQueue"
                  :key="record.id"
                  class="hover:bg-gray-50/50 transition-colors"
                >
                  <td class="p-4 pl-6 sm:pl-8">
                    <span class="font-black font-montserrat text-black">{{
                      record.matric_number
                    }}</span>
                  </td>
                  <td class="p-4">
                    <span
                      class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                      :class="
                        record.scan_type === 'SIGN_IN'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      "
                    >
                      {{ record.scan_type.replace("_", " ") }}
                    </span>
                  </td>
                  <td class="p-4 pr-6 sm:pr-8 text-right">
                    <span
                      class="text-xs text-gray-500 font-medium font-poppins"
                    >
                      {{
                        new Date(record.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  shallowRef,
} from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useScanner } from "~/composables/useScanner";

const router = useRouter();
const { token, initAuth } = useAuth();

// State
const selectedEventId = ref(null);
const eventStatus = ref("SIGN_IN_ACTIVE");
const activeEvents = shallowRef([]);
const isLoadingEvents = ref(false);

const isCameraActive = ref(false);
const forceKillCamera = ref(false); // Used to pass a kill signal to ScannerCamera.vue

const manualMatric = ref("FT");
const isManualSubmitting = ref(false);
let pollInterval = null;

// Initialize our extracted Composable
const {
  isOnline,
  isSyncing,
  unsyncedQueue,
  syncErrors,
  scannedMatric,
  scanWarning,
  handleScan,
  syncRecords,
  clearQueue,
} = useScanner(selectedEventId, eventStatus);

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

const submitManual = async () => {
  if (manualMatric.value) {
    isManualSubmitting.value = true;
    forceKillCamera.value = true; // Tell child component to stop camera
    await handleScan(manualMatric.value);
    manualMatric.value = "FT";
    isManualSubmitting.value = false;
    setTimeout(() => (forceKillCamera.value = false), 500); // Reset the kill signal
  }
};

const checkEventStatus = async () => {
  if (!isOnline.value || !selectedEventId.value) return;
  try {
    const data = await useApiFetch(`/events/${selectedEventId.value}/status`);
    eventStatus.value = data.status; // Watchers handle the rest
  } catch (error) {
    console.error("Failed to check event status:", error);
  }
};

watch(eventStatus, async (newStatus) => {
  if (newStatus === "SYNCING_PHASE") {
    forceKillCamera.value = true;
    if (isOnline.value) await syncRecords();
    setTimeout(() => (forceKillCamera.value = false), 500);
  }
});

const selectEvent = (eventId) => {
  forceKillCamera.value = true;
  selectedEventId.value = eventId;
  checkEventStatus();

  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkEventStatus, 10000);

  setTimeout(() => (forceKillCamera.value = false), 500);
};

onMounted(() => {
  initAuth();
  if (!token.value) return router.push("/login");
  loadActiveEvents();
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
