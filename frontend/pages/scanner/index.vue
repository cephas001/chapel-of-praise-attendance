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
            Mark attendance with efficiency.
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
        <div class="lg:col-span-5 flex flex-col gap-6 order-1">
          <EventSelector
            :events="activeEvents"
            :selectedId="selectedEventId"
            :isLoading="isLoadingEvents"
            v-model:isOpen="isRegistryOpen"
            @select="(event) => selectEvent(event.id)"
          />

          <QueueSummaryWidget
            class="hidden lg:block"
            :pendingCount="unsyncedQueue.length"
            :rejectedCount="syncErrors.length"
            :isSyncing="isSyncing"
            @viewRejections="viewRejections"
          />
        </div>

        <div class="lg:col-span-7 space-y-6 order-2">
          <div
            v-if="!selectedEventId"
            class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-70"
          >
            <div
              class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 text-gray-400"
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
            <div class="flex flex-col gap-6 animate-fade-in">
              <div
                class="bg-black text-white p-6 sm:p-8 rounded-2xl flex justify-between items-center shadow-lg border border-gray-800"
              >
                <div>
                  <p
                    class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"
                  >
                    <span
                      class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                    ></span>
                    Active Scanner
                  </p>
                  <h3
                    class="text-xl sm:text-2xl font-black font-poppins tracking-tight"
                  >
                    {{ selectedEventName }}
                  </h3>
                </div>
                <button
                  @click="clearSelection"
                  class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors border border-gray-700"
                  title="Close Scanner"
                >
                  <Icon name="material-symbols:close" class="text-lg" />
                </button>
              </div>

              <MyDutyWidget :eventId="selectedEventId" />

              <QueueSummaryWidget
                class="block lg:hidden"
                :pendingCount="unsyncedQueue.length"
                :rejectedCount="syncErrors.length"
                :isSyncing="isSyncing"
                @viewRejections="viewRejections"
              />

              <div
                v-if="eventStatus === 'SYNCING_PHASE'"
                class="bg-orange-50 border border-orange-200 rounded-2xl p-10 text-center shadow-sm flex flex-col items-center"
              >
                <div
                  class="bg-orange-100 text-orange-700 p-4 rounded-full mb-6"
                >
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
                  The system is synchronizing all devices. Scanning is
                  temporarily disabled.
                </p>
              </div>

              <div
                v-else-if="!isUnlocked"
                class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  class="bg-gray-900 text-white p-8 sm:p-12 text-center border-b border-gray-800"
                >
                  <div
                    class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-gray-400"
                  >
                    <Icon name="material-symbols:lock" class="text-3xl" />
                  </div>
                  <h2 class="text-2xl font-black font-montserrat mb-2">
                    Venue Lock Active
                  </h2>
                  <p class="text-sm text-gray-400 font-medium max-w-sm mx-auto">
                    You must be physically present with the Super Admin to
                    unlock this event. Scan their QR code or enter the manual
                    PIN.
                  </p>
                </div>

                <ScannerCamera
                  :forceStop="forceKillCamera"
                  @scanned="submitUnlock"
                  @cameraStateChanged="isCameraActive = $event"
                />

                <div class="p-6 sm:p-8 bg-gray-50 border-t border-gray-100">
                  <form
                    @submit.prevent="submitUnlock()"
                    class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                  >
                    <input
                      v-model="unlockPin"
                      type="text"
                      placeholder="Enter 6-Digit PIN"
                      class="grow border-gray-300 focus:border-black border rounded-xl py-3 px-4 text-center sm:text-left text-black font-poppins uppercase tracking-widest font-bold outline-none"
                      maxlength="6"
                    />
                    <button
                      type="submit"
                      :disabled="isUnlocking || unlockPin.length < 5"
                      class="px-8 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Icon
                        v-if="isUnlocking"
                        name="material-symbols:sync"
                        class="animate-spin text-lg"
                      />
                      <Icon
                        v-else
                        name="material-symbols:key"
                        class="text-lg"
                      />
                      Unlock
                    </button>
                  </form>
                </div>
              </div>

              <template v-else>
                <div
                  v-if="
                    eventStatus === 'SIGN_IN_ACTIVE' ||
                    eventStatus === 'SIGN_OUT_ACTIVE'
                  "
                  class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
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
                        <h2
                          class="text-xl font-bold text-black font-montserrat"
                        >
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
                          :class="
                            scanWarning ? 'text-red-500' : 'text-green-400'
                          "
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
                      class="grow border-gray-400 focus:border-black border rounded-md py-3 px-4 text-black outline-none transition-all"
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
                      {{
                        isManualSubmitting ? "Verifying..." : "Verify Record"
                      }}
                    </button>
                  </form>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>

      <div
        id="queue-inspector"
        v-if="unsyncedQueue.length > 0 || syncErrors.length > 0"
        class="mt-8 animate-fade-in"
      >
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
                Records saved on this device.
              </p>
            </div>

            <div
              class="flex p-1 bg-gray-200/50 rounded-lg w-full md:w-auto shrink-0"
            >
              <button
                @click="activeTab = 'pending'"
                class="px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 w-[50%] justify-center"
                :class="
                  activeTab === 'pending'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                Pending
                <span
                  class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >{{ unsyncedQueue.length }}</span
                >
              </button>
              <button
                @click="activeTab = 'rejected'"
                class="px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 w-[50%] justify-center"
                :class="
                  activeTab === 'rejected'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                "
              >
                <span
                  v-if="syncErrors.length > 0"
                  class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                ></span>
                Rejected
                <span class="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{{
                  syncErrors.length
                }}</span>
              </button>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              <button
                @click="clearQueue"
                class="flex-1 md:flex-none px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                Clear
              </button>
              <button
                @click="syncRecords"
                :disabled="isSyncing || !isOnline"
                class="flex-1 md:flex-none px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {{ isSyncing ? "Syncing..." : "Sync" }}
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
                  <th v-if="activeTab === 'pending'" class="p-4 font-medium">
                    Scan Type
                  </th>
                  <th
                    v-if="activeTab === 'pending'"
                    class="p-4 pr-6 sm:pr-8 font-medium text-right"
                  >
                    Timestamp
                  </th>
                  <th
                    v-if="activeTab === 'rejected'"
                    class="p-4 pr-6 sm:pr-8 font-medium"
                  >
                    Rejection Reason
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-if="activeTab === 'pending'">
                  <tr
                    v-for="record in unsyncedQueue"
                    :key="record.id"
                    class="hover:bg-gray-50/50 transition-colors"
                  >
                    <td class="p-4 pl-6 sm:pl-8">
                      <span class="font-semibold font-montserrat text-black">{{
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
                  <tr v-if="unsyncedQueue.length === 0">
                    <td
                      colspan="3"
                      class="text-center p-8 text-xs text-gray-500 font-medium"
                    >
                      No pending records in queue.
                    </td>
                  </tr>
                </template>

                <template v-if="activeTab === 'rejected'">
                  <tr
                    v-for="(record, index) in syncErrors"
                    :key="index"
                    class="hover:bg-red-50/30 transition-colors"
                  >
                    <td class="p-4 pl-6 sm:pl-8">
                      <span class="font-semibold font-montserrat text-black">{{
                        record.matric_number || record.matric || "Unknown"
                      }}</span>
                    </td>
                    <td class="p-4 pr-6 sm:pr-8">
                      <span
                        class="text-xs text-red-600 font-medium font-poppins"
                      >
                        {{
                          record.error ||
                          record.reason ||
                          record.message ||
                          "Validation failed or scanned previously"
                        }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="syncErrors.length === 0">
                    <td
                      colspan="2"
                      class="text-center p-8 text-xs text-gray-500 font-medium"
                    >
                      No rejected records found.
                    </td>
                  </tr>
                </template>
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
import { useToast } from "~/composables/useToast";

const router = useRouter();
const { token } = useAuth();
const toast = useToast();

const isRegistryOpen = ref(true); // Controls the accordion

const isUnlocked = ref(false);
const unlockPin = ref("");
const isUnlocking = ref(false);

const activeTab = ref("pending");

const checkAccess = async () => {
  if (!selectedEventId.value) return;
  try {
    const data = await useApiFetch(
      `/events/${selectedEventId.value}/check-access`,
    );
    isUnlocked.value = data.unlocked;
  } catch (error) {
    console.error("Access check failed", error);
  }
};

const submitUnlock = async (scannedPin = null) => {
  const finalPin =
    typeof scannedPin === "string" ? scannedPin : unlockPin.value;
  if (!finalPin) return;

  isUnlocking.value = true;
  forceKillCamera.value = true;

  try {
    await useApiFetch(`/events/${selectedEventId.value}/unlock`, {
      method: "POST",
      body: { pin: finalPin },
    });

    isUnlocked.value = true;
    toast.success("Event Unlocked! You may now begin scanning.");
    unlockPin.value = "";
  } catch (error) {
    toast.error(error.data?.error || "Invalid PIN.");
    setTimeout(() => (forceKillCamera.value = false), 500);
  } finally {
    isUnlocking.value = false;
  }
};

const selectedEventId = ref(null);
const eventStatus = ref("SIGN_IN_ACTIVE");
const activeEvents = shallowRef([]);
const isLoadingEvents = ref(false);

const isCameraActive = ref(false);
const forceKillCamera = ref(false);

const manualMatric = ref("FT");
const isManualSubmitting = ref(false);
let pollInterval = null;

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

const viewRejections = () => {
  if (unsyncedQueue.value.length === 0 && syncErrors.value.length === 0) {
    toast.info("No records in the local queue.");
    return;
  }

  activeTab.value = "rejected";

  setTimeout(() => {
    document.getElementById("queue-inspector")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
};

watch(
  () => syncErrors.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      activeTab.value = "rejected";
    }
  },
);

const selectedEventName = computed(() => {
  const event = activeEvents.value.find((e) => e.id === selectedEventId.value);
  return event ? event.name : "Active Event";
});

const loadActiveEvents = async () => {
  if (!isOnline.value) {
    const cachedEvents = localStorage.getItem("backup_active_events");
    if (cachedEvents) {
      activeEvents.value = JSON.parse(cachedEvents);
      toast.info("Loaded events from offline backup.");
    } else {
      isLoadingEvents.value = false;
    }
    return;
  }

  isLoadingEvents.value = true;
  try {
    const data = await useApiFetch("/events/active");
    activeEvents.value = data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    localStorage.setItem(
      "backup_active_events",
      JSON.stringify(activeEvents.value),
    );
  } catch (error) {
    const cachedEvents = localStorage.getItem("backup_active_events");
    if (cachedEvents) {
      activeEvents.value = JSON.parse(cachedEvents);
    } else {
      toast.error("Failed to load events", "Backend Error");
    }
  } finally {
    isLoadingEvents.value = false;
  }
};

const submitManual = async () => {
  if (manualMatric.value) {
    isManualSubmitting.value = true;
    forceKillCamera.value = true;
    await handleScan(manualMatric.value);
    manualMatric.value = "FT";
    isManualSubmitting.value = false;
    setTimeout(() => (forceKillCamera.value = false), 500);
  }
};

const checkEventStatus = async () => {
  if (!isOnline.value || !selectedEventId.value) return;
  try {
    const data = await useApiFetch(`/events/${selectedEventId.value}/status`);
    eventStatus.value = data.status;
  } catch (error) {
    toast.error("Failed to check event status:", "Backend Error");
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

  isRegistryOpen.value = false;
  if (window.innerWidth < 1024) {
    setTimeout(() => window.scrollTo({ top: 150, behavior: "smooth" }), 150);
  }

  checkEventStatus();
  checkAccess();

  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(checkEventStatus, 10000);
  setTimeout(() => (forceKillCamera.value = false), 500);
};

const clearSelection = () => {
  forceKillCamera.value = true;
  selectedEventId.value = null;
  isRegistryOpen.value = true;
  setTimeout(() => (forceKillCamera.value = false), 500);
};

onMounted(() => {
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
