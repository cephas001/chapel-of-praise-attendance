<template>
  <div class="min-h-screen bg-canvas text-ink font-sans pb-24">
    <main class="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
      <LedgerPageHeader eyebrow="attendance register" title="Scanner">
        <template #status>
          <span class="led-eyebrow flex items-center gap-2">
            <span
              class="h-1.5 w-1.5 rounded-[1px]"
              :class="isOnline ? 'bg-status-live' : 'bg-status-error'"
            ></span>
            {{ isOnline ? "online" : "offline" }}
          </span>
        </template>

        <template #actions>
          <button
            type="button"
            class="led-eyebrow inline-flex min-h-11 items-center gap-1.5 py-2 transition-colors hover:text-ink disabled:opacity-50"
            :disabled="isLoadingEvents"
            aria-label="Refresh events"
            @click="loadActiveEvents"
          >
            <Icon
              name="material-symbols:refresh"
              class="text-base"
              :class="{ 'animate-spin': isLoadingEvents }"
            />
            {{ isLoadingEvents ? "refreshing" : "refresh" }}
          </button>
        </template>
      </LedgerPageHeader>

      <div
        class="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-12 lg:gap-0 lg:pt-10"
      >
        <div class="lg:col-span-4 lg:pr-8">
          <LedgerEventRegister
            v-model:isOpen="isRegistryOpen"
            :events="activeEvents"
            :selectedId="selectedEventId"
            :isLoading="isLoadingEvents"
            @select="(event) => selectEvent(event.id)"
          />
        </div>

        <div class="lg:col-span-8 lg:border-l lg:border-rule lg:pl-8">
          <div v-if="!selectedEventId" class="lg:min-h-[22rem]">
            <p class="led-eyebrow">no event selected</p>
            <h2 class="led-display mt-2 max-w-sm text-[28px] sm:text-[32px]">
              Choose an event to open the scanner.
            </h2>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Only events an admin has created appear here. Scans are saved on
              this device until they sync.
            </p>
          </div>

          <template v-else>
            <div
              v-if="eventStatus === 'SYNCING_PHASE'"
              class="border-t border-rule pt-6 lg:border-t-0 lg:pt-0"
            >
              <p class="led-eyebrow text-status-syncing">sync phase</p>
              <h2 class="led-display mt-2 max-w-md text-[28px] sm:text-[32px]">
                {{ selectedEventName }} is consolidating.
              </h2>
              <p class="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Scanning is paused while all devices sync.
              </p>
            </div>

            <div v-else-if="!isUnlocked">
              <div
                class="flex flex-wrap items-start justify-between gap-4 pb-6"
              >
                <div>
                  <p class="led-eyebrow">venue lock</p>
                  <h2
                    class="led-display mt-2 max-w-sm text-[26px] sm:text-[30px]"
                  >
                    Event locked.
                  </h2>
                  <p class="mt-2 max-w-md text-sm leading-relaxed text-muted">
                    The Super Admin must be present. Enter the access code to
                    open scanning.
                  </p>
                </div>
                <span
                  class="led-eyebrow flex items-center gap-2 text-status-locked"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-[1px] bg-status-locked"
                  ></span>
                  locked
                </span>
              </div>

              <ScannerCamera
                :forceStop="forceKillCamera"
                @scanned="submitUnlock"
                @cameraStateChanged="isCameraActive = $event"
              />

              <form
                @submit.prevent="submitUnlock()"
                class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div class="sm:w-56">
                  <label for="unlock-pin" class="led-eyebrow mb-2 block"
                    >venue pin</label
                  >
                  <input
                    id="unlock-pin"
                    v-model="unlockPin"
                    type="text"
                    inputmode="numeric"
                    placeholder="000000"
                    maxlength="6"
                    class="led-field text-center font-mono tracking-[0.4em]"
                  />
                </div>
                <button
                  type="submit"
                  :disabled="isUnlocking || unlockPin.length < 5"
                  class="led-btn led-btn-primary sm:mb-px"
                >
                  <Icon
                    v-if="isUnlocking"
                    name="material-symbols:sync"
                    class="animate-spin text-lg"
                  />
                  <Icon v-else name="material-symbols:key" class="text-lg" />
                  {{ isUnlocking ? "Unlocking" : "Unlock" }}
                </button>
              </form>
            </div>

            <template v-else>
              <LedgerPhaseBar
                :name="selectedEventName"
                :context="getEventStatus(eventStatus).label.toLowerCase()"
                :dotClass="getEventStatus(eventStatus).dotClass"
                @close="clearSelection"
              />

              <template v-if="isScanPhase">
                <ScannerCamera
                  :forceStop="forceKillCamera"
                  @scanned="handleScan"
                  @cameraStateChanged="isCameraActive = $event"
                />

                <div
                  v-if="scannedMatric || scanWarning"
                  aria-live="polite"
                  class="flex items-center gap-3 border-b border-rule py-3"
                >
                  <span
                    class="h-2 w-2 shrink-0 rounded-[1px]"
                    :class="
                      scanWarning ? 'bg-status-error' : 'bg-status-success'
                    "
                  ></span>
                  <p
                    class="min-w-0 truncate font-mono text-[13px] leading-snug"
                    :class="scanWarning ? 'text-status-error' : 'text-ink'"
                  >
                    {{ scanWarning || scannedMatric }}
                  </p>
                  <span v-if="!scanWarning" class="led-eyebrow ml-auto shrink-0"
                    >logged</span
                  >
                </div>
              </template>

              <p
                v-else
                class="border-b border-rule py-4 text-sm leading-relaxed text-muted"
              >
                Scanning opens when the admin starts this phase.
              </p>

              <div class="flex items-start gap-10 pl-2 py-6 mt-4">
                <LedgerStat :value="pendingCount" label="waiting to sync" />

                <LedgerStat
                  clickable
                  :value="syncErrors.length"
                  label="rejected"
                  tone="error"
                  @click="viewRejections"
                />

                <span
                  class="led-eyebrow ml-auto hidden items-center gap-2 self-center sm:flex"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-[1px]"
                    :class="
                      isCameraActive ? 'bg-status-live' : 'bg-status-archived'
                    "
                  ></span>
                  {{ isCameraActive ? "camera live" : "camera idle" }}
                </span>
              </div>

              <MyDutyWidget :eventId="selectedEventId" class="mt-6" />

              <form
                v-if="isScanPhase"
                @submit.prevent="submitManual"
                class="mt-8 border-t border-rule pt-6"
              >
                <label for="manual-matric" class="led-eyebrow mb-2 block"
                  >manual entry</label
                >
                <div class="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="manual-matric"
                    v-model="manualMatric"
                    type="text"
                    required
                    placeholder="FT…"
                    class="led-field font-mono uppercase sm:max-w-xs"
                  />
                  <button
                    type="submit"
                    :disabled="isManualSubmitting"
                    class="led-btn led-btn-primary"
                  >
                    <Icon
                      v-if="isManualSubmitting"
                      name="material-symbols:sync"
                      class="animate-spin text-lg"
                    />
                    {{ isManualSubmitting ? "Recording" : "Record attendance" }}
                  </button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </div>

      <section
        v-if="pendingCount > 0 || syncErrors.length > 0"
        id="queue-inspector"
        class="queue-inspector-section mt-12 animate-fade-in border-t border-rule-strong pt-8"
      >
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="led-eyebrow">on this device</p>
            <h2 class="led-display mt-1 text-[26px]">Saved records</h2>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="led-btn led-btn-danger"
              @click="clearQueue"
            >
              Clear
            </button>
            <button
              type="button"
              class="led-btn led-btn-primary"
              :disabled="isSyncing || !isOnline"
              @click="syncRecords"
            >
              <Icon
                v-if="isSyncing"
                name="material-symbols:sync"
                class="animate-spin text-base"
              />
              {{ isSyncing ? "Syncing" : "Sync now" }}
            </button>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-6 border-b border-rule">
          <button
            type="button"
            class="flex items-baseline gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors"
            :class="
              activeTab === 'pending'
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
            :aria-pressed="activeTab === 'pending'"
            @click="activeTab = 'pending'"
          >
            Pending
            <span class="font-mono text-xs font-normal">{{
              pendingCount
            }}</span>
          </button>

          <button
            type="button"
            class="flex items-baseline gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors"
            :class="
              activeTab === 'rejected'
                ? 'border-status-error text-status-error'
                : 'border-transparent text-muted hover:text-ink'
            "
            :aria-pressed="activeTab === 'rejected'"
            @click="activeTab = 'rejected'"
          >
            Rejected
            <span class="font-mono text-xs font-normal">{{
              syncErrors.length
            }}</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr>
                <th class="led-eyebrow py-3 pr-4 font-normal">matric number</th>
                <th
                  v-if="activeTab === 'pending'"
                  class="led-eyebrow py-3 pr-4 font-normal"
                >
                  scan type
                </th>
                <th
                  v-if="activeTab === 'pending'"
                  class="led-eyebrow py-3 font-normal text-right"
                >
                  time
                </th>
                <th
                  v-if="activeTab === 'rejected'"
                  class="led-eyebrow py-3 font-normal"
                >
                  rejection reason
                </th>
              </tr>
            </thead>

            <tbody>
              <template v-if="activeTab === 'pending'">
                <tr
                  v-for="record in visibleQueue"
                  :key="record.id"
                  class="border-t border-rule transition-colors hover:bg-inset/50"
                >
                  <td class="py-3 pr-4 font-mono text-[13px] text-ink">
                    {{ record.matric_number }}
                  </td>
                  <td class="py-3 pr-4">
                    <span class="led-eyebrow flex items-center gap-1.5">
                      <span
                        class="h-1.5 w-1.5 rounded-[1px]"
                        :class="
                          record.scan_type === 'SIGN_IN'
                            ? 'bg-status-live'
                            : 'bg-status-locked'
                        "
                      ></span>
                      {{ record.scan_type.replace("_", " ").toLowerCase() }}
                    </span>
                  </td>
                  <td class="py-3 text-right font-mono text-[12px] text-muted">
                    {{
                      new Date(record.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    }}
                  </td>
                </tr>

                <tr v-if="pendingCount > MAX_VISIBLE_QUEUE_ROWS">
                  <td
                    colspan="3"
                    class="border-t border-rule py-4 text-sm text-muted"
                  >
                    Showing the latest {{ MAX_VISIBLE_QUEUE_ROWS }} of
                    {{ pendingCount }} pending records.
                  </td>
                </tr>

                <tr v-if="unsyncedQueue.length === 0">
                  <td
                    colspan="3"
                    class="border-t border-rule py-6 text-sm text-muted"
                  >
                    No pending records.
                  </td>
                </tr>
              </template>

              <template v-if="activeTab === 'rejected'">
                <tr
                  v-for="(record, index) in visibleRejections"
                  :key="record.id ?? index"
                  class="border-t border-rule transition-colors hover:bg-inset/50"
                >
                  <td class="py-3 pr-4 font-mono text-[13px] text-ink">
                    {{ record.matric_number || record.matric || "Unknown" }}
                  </td>
                  <td class="py-3 text-sm leading-snug text-status-error">
                    {{
                      record.sync_error ||
                      record.error ||
                      record.reason ||
                      record.message ||
                      "Validation failed or already scanned"
                    }}
                  </td>
                </tr>

                <tr v-if="syncErrors.length > MAX_VISIBLE_QUEUE_ROWS">
                  <td
                    colspan="2"
                    class="border-t border-rule py-4 text-sm text-muted"
                  >
                    Showing the latest {{ MAX_VISIBLE_QUEUE_ROWS }} of
                    {{ syncErrors.length }} rejected records.
                  </td>
                </tr>

                <tr v-if="syncErrors.length === 0">
                  <td
                    colspan="2"
                    class="border-t border-rule py-6 text-sm text-muted"
                  >
                    No rejected records.
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </section>
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
import { useAppToast } from "~/composables/useAppToast";
import { useMessages } from "~/composables/useMessages";
import { getEventStatus } from "~/composables/useStatus";

const router = useRouter();
const { token, user } = useAuth();
const toast = useAppToast();
const { isSseConnected, lastStatusEvent } = useMessages();

const isRegistryOpen = ref(true); // Controls the accordion

const isUnlocked = ref(false);
const unlockPin = ref("");
const isUnlocking = ref(false);

const activeTab = ref("pending");
const ERROR_TOAST_THROTTLE_MS = 30_000;
const lastErrorToastAtByKey = new Map();

const notifyErrorThrottled = (key, message, title = "Error") => {
  const now = Date.now();
  const lastAt = lastErrorToastAtByKey.get(key) ?? 0;

  if (now - lastAt < ERROR_TOAST_THROTTLE_MS) return;

  lastErrorToastAtByKey.set(key, now);
  toast.error(message, title);
};

// Remember which events this device has unlocked so an offline reload does not
// fall back to the venue-lock screen. The server still enforces access when
// queued scans eventually sync; this only keeps the UI usable offline.
const UNLOCKED_EVENTS_CACHE_KEY = "backup_unlocked_events";

const readCachedUnlockedEvents = () => {
  if (!import.meta.client) return new Set();

  try {
    const raw = localStorage.getItem(UNLOCKED_EVENTS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id) => typeof id === "string" && id)
        : [],
    );
  } catch (_) {
    return new Set();
  }
};

const cacheUnlockedEvent = (eventId) => {
  if (!import.meta.client || !eventId) return;

  try {
    const unlocked = readCachedUnlockedEvents();
    unlocked.add(eventId);
    localStorage.setItem(
      UNLOCKED_EVENTS_CACHE_KEY,
      JSON.stringify([...unlocked]),
    );
  } catch (_) {
    // Cache writes are best-effort (private mode / quota exhaustion).
  }
};

const isEventUnlockedLocally = (eventId) =>
  Boolean(eventId) && readCachedUnlockedEvents().has(eventId);

// Super admins bypass the venue PIN on the server, so mirror that offline.
const isUnlockedFor = (eventId) =>
  isEventUnlockedLocally(eventId) || user.value?.role === "SUPER_ADMIN";

const checkAccess = async (eventId = selectedEventId.value) => {
  if (!eventId) return;

  if (!isOnline.value) {
    isUnlocked.value = isUnlockedFor(eventId);
    return;
  }

  try {
    const data = await useApiFetch(`/events/${eventId}/check-access`);

    // Ignore a response that belongs to a previously selected event.
    if (selectedEventId.value !== eventId) return;

    isUnlocked.value = Boolean(data?.unlocked);
    if (data?.unlocked) cacheUnlockedEvent(eventId);
  } catch (error) {
    if (selectedEventId.value !== eventId) return;

    isUnlocked.value = isUnlockedFor(eventId);
    console.error("Access check failed", error);
  }
};

const submitUnlock = async (scannedPin = null) => {
  const eventId = selectedEventId.value;
  const finalPin =
    typeof scannedPin === "string" ? scannedPin : unlockPin.value;
  if (!eventId || !finalPin) return;

  isUnlocking.value = true;
  forceKillCamera.value = true;

  try {
    await useApiFetch(`/events/${eventId}/unlock`, {
      method: "POST",
      body: { pin: finalPin },
    });

    // Cache for this event even if the user switched away mid-request.
    cacheUnlockedEvent(eventId);

    if (selectedEventId.value !== eventId) return;

    isUnlocked.value = true;
    toast.success("Event Unlocked! You may now begin scanning.");
    unlockPin.value = "";
  } catch (error) {
    if (selectedEventId.value === eventId) {
      toast.error(error.data?.error || "Invalid PIN.");
      setTimeout(() => (forceKillCamera.value = false), 500);
    }
  } finally {
    isUnlocking.value = false;
  }
};

const selectedEventId = ref(null);
const eventStatus = ref("SIGN_IN_ACTIVE");

const ACTIVE_EVENTS_CACHE_KEY = "backup_active_events";

const sortEventsNewestFirst = (events) =>
  [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

const readCachedActiveEvents = () => {
  if (!import.meta.client) return null;

  try {
    const raw = localStorage.getItem(ACTIVE_EVENTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sortEventsNewestFirst(parsed) : null;
  } catch (_) {
    return null;
  }
};

const writeCachedActiveEvents = (events) => {
  if (!import.meta.client) return;

  try {
    localStorage.setItem(ACTIVE_EVENTS_CACHE_KEY, JSON.stringify(events));
  } catch (_) {
    // Cache writes are best-effort (private mode / quota exhaustion).
  }
};

// Hydrate synchronously so the last known list paints on the first frame.
const cachedActiveEvents = readCachedActiveEvents();
const activeEvents = shallowRef(cachedActiveEvents ?? []);
const isLoadingEvents = ref(cachedActiveEvents === null);

const isCameraActive = ref(false);
const forceKillCamera = ref(false);

const manualMatric = ref("FT");
const isManualSubmitting = ref(false);
const STATUS_FALLBACK_POLL_MS = 20_000;
let pollInterval = null;

const {
  isOnline,
  isSyncing,
  pendingCount,
  unsyncedQueue,
  syncErrors,
  scannedMatric,
  scanWarning,
  handleScan,
  syncRecords,
  clearQueue,
} = useScanner(selectedEventId, eventStatus);

const MAX_VISIBLE_QUEUE_ROWS = 50;
const visibleQueue = computed(() =>
  unsyncedQueue.value.slice(0, MAX_VISIBLE_QUEUE_ROWS),
);
const visibleRejections = computed(() =>
  syncErrors.value.slice(0, MAX_VISIBLE_QUEUE_ROWS),
);

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

const isScanPhase = computed(
  () =>
    eventStatus.value === "SIGN_IN_ACTIVE" ||
    eventStatus.value === "SIGN_OUT_ACTIVE",
);

const loadActiveEvents = async (options = {}) => {
  const background = options?.background === true;

  if (!isOnline.value) {
    isLoadingEvents.value = false;

    if (activeEvents.value.length === 0) {
      const cached = readCachedActiveEvents();
      if (cached) {
        activeEvents.value = cached;
        maybeAutoSelectSoleEvent();
        toast.info("Loaded events from offline backup.");
      }
    }
    return;
  }

  // A background revalidation never replaces the visible cached list with a
  // blocking spinner.
  if (!background) isLoadingEvents.value = true;

  try {
    const data = await useApiFetch("/events/active");
    if (!Array.isArray(data)) {
      throw new Error("Unexpected active events response.");
    }

    activeEvents.value = sortEventsNewestFirst(data);
    writeCachedActiveEvents(activeEvents.value);
    maybeAutoSelectSoleEvent();
  } catch (error) {
    if (activeEvents.value.length === 0) {
      const cached = readCachedActiveEvents();
      if (cached) {
        activeEvents.value = cached;
        maybeAutoSelectSoleEvent();
      } else {
        toast.error(
          "Couldn't load events. Check your connection and try again.",
        );
      }
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

// Monotonic id so overlapping status checks can never apply out of order.
let statusRequestId = 0;

const checkEventStatus = async () => {
  if (!isOnline.value || !selectedEventId.value) return;

  const eventId = selectedEventId.value;
  const requestId = ++statusRequestId;

  try {
    const data = await useApiFetch(`/events/${eventId}/status`);

    if (requestId !== statusRequestId || selectedEventId.value !== eventId) {
      return;
    }

    eventStatus.value = data.status;
  } catch {
    if (requestId === statusRequestId) {
      notifyErrorThrottled(
        "event-status",
        "Couldn't load events. Check your connection and try again.",
      );
    }
  }
};

// Revalidate access when connectivity returns; an offline reload may have
// opened on the lock screen from an empty cache.
watch(isOnline, (online) => {
  if (online && selectedEventId.value) {
    checkAccess(selectedEventId.value);
  }
});

const stopStatusPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

const startStatusPolling = () => {
  if (pollInterval || !selectedEventId.value || isSseConnected.value) return;

  // Fallback only: SSE is the primary status channel.
  pollInterval = setInterval(checkEventStatus, STATUS_FALLBACK_POLL_MS);
};

// Apply live phase changes immediately.
watch(lastStatusEvent, (statusEvent) => {
  if (!statusEvent || !selectedEventId.value) return;

  const eventId = statusEvent.event_id ?? statusEvent.eventId;
  if (eventId !== selectedEventId.value || !statusEvent.status) return;

  eventStatus.value = statusEvent.status;
});

// Poll only while the live stream is unavailable, and refresh immediately
// whenever it reconnects.
watch(isSseConnected, (connected) => {
  if (!selectedEventId.value) return;

  if (connected) {
    stopStatusPolling();
    checkEventStatus();
    return;
  }

  startStatusPolling();
});

watch(eventStatus, async (newStatus) => {
  if (newStatus === "SYNCING_PHASE") {
    forceKillCamera.value = true;
    if (isOnline.value) await syncRecords();
    setTimeout(() => (forceKillCamera.value = false), 500);
  }
});

const selectEvent = (eventId, options = {}) => {
  const shouldScroll = options.scroll !== false;
  const event = activeEvents.value.find((entry) => entry.id === eventId);

  forceKillCamera.value = true;

  // Invalidate in-flight checks for the previous event before switching, then
  // reset the lock and phase immediately so the old event never bleeds into
  // the new one while the network requests are still in flight.
  statusRequestId += 1;
  selectedEventId.value = eventId;
  isUnlocked.value = false;
  eventStatus.value = event?.status || "SIGN_IN_ACTIVE";
  unlockPin.value = "";

  isRegistryOpen.value = false;
  if (shouldScroll && window.innerWidth < 1024) {
    setTimeout(() => window.scrollTo({ top: 150, behavior: "smooth" }), 150);
  }

  checkEventStatus();
  checkAccess(eventId);

  if (isSseConnected.value) {
    stopStatusPolling();
  } else {
    startStatusPolling();
  }

  setTimeout(() => (forceKillCamera.value = false), 500);
};

const maybeAutoSelectSoleEvent = () => {
  if (selectedEventId.value || activeEvents.value.length !== 1) return;
  selectEvent(activeEvents.value[0].id, { scroll: false });
};

const clearSelection = () => {
  forceKillCamera.value = true;
  statusRequestId += 1;
  selectedEventId.value = null;
  isUnlocked.value = false;
  eventStatus.value = "SIGN_IN_ACTIVE";
  isRegistryOpen.value = true;
  stopStatusPolling();
  setTimeout(() => (forceKillCamera.value = false), 500);
};

onMounted(() => {
  if (!token.value) return router.push("/login");
  // With one active event there is nothing to choose; enter the scanner.
  maybeAutoSelectSoleEvent();
  // Show cached events right away, then revalidate in the background.
  loadActiveEvents({ background: true });
});

onBeforeUnmount(() => {
  stopStatusPolling();
});
</script>

<style scoped>
.queue-inspector-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 640px;
}
</style>
