// frontend/composables/useScanner.js
import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from "vue";
import { db } from "~/utils/db";
import { useAuth } from "~/composables/useAuth";
import { useAppToast } from "~/composables/useAppToast";
import { useConfirm } from "~/composables/useConfirm";

const scanSuccessAudioUrl = new URL(
  "../assets/audio/scan1.mp3",
  import.meta.url,
).href;
const syncSuccessAudioUrl = new URL(
  "../assets/audio/synced.mp3",
  import.meta.url,
).href;
const errorAudioUrl = new URL("../assets/audio/error.mp3", import.meta.url)
  .href;

const SYNC_BATCH_SIZE = 100;
const SYNC_REQUEST_RETRIES = 2;
const REJECTED_SYNC_STATUS = "rejected";
const ERROR_TOAST_THROTTLE_MS = 15_000;

const newestFirst = (a, b) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

const oldestFirst = (a, b) =>
  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

export const useScanner = (selectedEventId, eventStatus) => {
  const { user } = useAuth();
  const toast = useAppToast();
  const confirmDialog = useConfirm();

  const isOnline = ref(true);
  const isSyncing = ref(false);
  const pendingCount = ref(0);
  const unsyncedQueue = shallowRef([]);
  const syncErrors = shallowRef([]);

  const scannedMatric = ref(null);
  const scanWarning = ref(null);

  let logTimeout = null;
  let scanSuccessAudio = null;
  let syncSuccessAudio = null;
  let errorAudio = null;
  let heartbeatInterval = null;
  let heartbeatInFlight = false;
  let syncController = null;
  let syncQueued = false;
  let pendingCountRequestId = 0;
  const lastErrorToastAtByKey = new Map();

  const playSound = (audio) => {
    if (!audio) return;

    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (_) {
      // Ignore playback errors from browser autoplay/device restrictions.
    }
  };

  // Clear the log toast after 4 seconds
  const clearLogAfterDelay = () => {
    if (logTimeout) clearTimeout(logTimeout);
    logTimeout = setTimeout(() => {
      scannedMatric.value = null;
      scanWarning.value = null;
    }, 4000);
  };

  const notifyErrorThrottled = (key, message, title = "Error") => {
    const now = Date.now();
    const lastAt = lastErrorToastAtByKey.get(key) ?? 0;

    if (now - lastAt < ERROR_TOAST_THROTTLE_MS) return;

    lastErrorToastAtByKey.set(key, now);
    toast.error(message, title);
  };

  // The badge is sourced from IndexedDB, not from the loaded UI array, so it
  // stays correct even when only the latest 50 rows are rendered.
  const refreshPendingCount = async () => {
    const requestId = ++pendingCountRequestId;

    try {
      const [total, rejected] = await Promise.all([
        db.unsynced_scans.count(),
        db.unsynced_scans
          .filter((record) => record.sync_status === REJECTED_SYNC_STATUS)
          .count(),
      ]);

      // Ignore an older count that resolved after a newer refresh.
      if (requestId !== pendingCountRequestId) return;

      pendingCount.value = Math.max(0, total - rejected);
    } catch (_) {
      if (requestId !== pendingCountRequestId) return;

      // Leave the last IndexedDB-derived value in place. Never fall back to
      // the truncated UI array, which may not represent the full queue.
    }
  };

  const loadQueue = async () => {
    const records = await db.unsynced_scans.toArray();
    const pending = [];
    const rejected = [];

    for (const record of records) {
      if (record.sync_status === REJECTED_SYNC_STATUS) {
        rejected.push(record);
      } else {
        pending.push(record);
      }
    }

    // Newest-first is only for the UI. syncRecords() sorts oldest-first.
    unsyncedQueue.value = pending.sort(newestFirst);
    syncErrors.value = rejected.sort(newestFirst);
    await refreshPendingCount();
  };

  // The Sync Engine
  const syncRecords = async () => {
    if (!isOnline.value) return;

    if (isSyncing.value) {
      // A scan may have arrived while a sync was in flight. Re-run after the
      // active pass so the queue is drained completely.
      syncQueued = true;
      return;
    }

    const hasPendingRecords = unsyncedQueue.value.some(
      (record) => record.sync_status !== REJECTED_SYNC_STATUS,
    );
    if (!hasPendingRecords) {
      await refreshPendingCount();
      return;
    }

    isSyncing.value = true;
    const controller = new AbortController();
    syncController = controller;
    let successfulSyncCount = 0;
    let syncAborted = false;

    try {
      while (isOnline.value && !syncAborted && !controller.signal.aborted) {
        // The API accepts at most 100 scans per request. Oldest-first ordering
        // ensures sign-ins are sent before their matching sign-outs.
        const batch = unsyncedQueue.value
          .filter((record) => record.sync_status !== REJECTED_SYNC_STATUS)
          .sort(oldestFirst)
          .slice(0, SYNC_BATCH_SIZE);

        if (batch.length === 0) break;

        try {
          const results = await useApiFetch("/attendance/sync", {
            method: "POST",
            body: batch.map((record) => ({
              id: String(record.id),
              event_id: record.eventId,
              usher_id: record.usher_id,
              matric_number: record.matric_number,
              scan_type: record.scan_type,
              scanned_at: record.timestamp,
            })),
            // Sync is explicitly retryable because every item carries a
            // client-generated id and the batch is safe to re-submit.
            retry: { retries: SYNC_REQUEST_RETRIES },
            signal: controller.signal,
          });

          if (!Array.isArray(results)) {
            throw new Error("Unexpected attendance sync response.");
          }

          const recordsById = new Map(
            batch.map((record) => [String(record.id), record]),
          );
          const acceptedIds = [];
          const rejectedRecords = [];

          for (const result of results) {
            const record = recordsById.get(String(result?.id));
            if (!record) continue;

            if (result.status === "accepted") {
              acceptedIds.push(record.id);
            } else if (result.status === REJECTED_SYNC_STATUS) {
              rejectedRecords.push({
                ...record,
                sync_status: REJECTED_SYNC_STATUS,
                sync_error:
                  result.reason || "Rejected by the server.",
                rejected_at: new Date().toISOString(),
              });
            }
          }

          if (acceptedIds.length > 0 || rejectedRecords.length > 0) {
            await db.transaction("rw", db.unsynced_scans, async () => {
              if (acceptedIds.length > 0) {
                await db.unsynced_scans.bulkDelete(acceptedIds);
              }

              if (rejectedRecords.length > 0) {
                await db.unsynced_scans.bulkUpdate(
                  rejectedRecords.map((record) => ({
                    key: record.id,
                    changes: {
                      sync_status: record.sync_status,
                      sync_error: record.sync_error,
                      rejected_at: record.rejected_at,
                    },
                  })),
                );
              }
            });
          }

          const acceptedIdSet = new Set(acceptedIds.map(String));
          const rejectedIdSet = new Set(
            rejectedRecords.map((record) => String(record.id)),
          );

          // Remove resolved records from the in-memory pending list. Anything
          // without a server result stays queued and will be retried.
          unsyncedQueue.value = unsyncedQueue.value.filter(
            (record) =>
              !acceptedIdSet.has(String(record.id)) &&
              !rejectedIdSet.has(String(record.id)),
          );

          if (rejectedRecords.length > 0) {
            syncErrors.value = [...rejectedRecords, ...syncErrors.value].sort(
              newestFirst,
            );
            playSound(errorAudio);
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          }

          successfulSyncCount += acceptedIds.length;
          await refreshPendingCount();

          // Defensive: avoid spinning forever if a response resolves nothing.
          if (acceptedIds.length === 0 && rejectedRecords.length === 0) break;
        } catch (error) {
          if (!controller.signal.aborted && error?.name !== "AbortError") {
            notifyErrorThrottled(
              "sync",
              "Couldn't sync. Your scans are still saved on this device.",
              "Sync Error",
            );
          }
          syncAborted = true;
        }
      }
    } finally {
      // Always release the lock, even after a timeout, abort, or DB failure.
      isSyncing.value = false;
      syncController = null;
      await refreshPendingCount();

      if (syncQueued) {
        syncQueued = false;
        if (isOnline.value) setTimeout(() => syncRecords(), 0);
      }
    }

    if (
      successfulSyncCount > 0 &&
      !syncAborted &&
      unsyncedQueue.value.length === 0
    ) {
      playSound(syncSuccessAudio);
    }
  };

  // Process a new scan
  const handleScan = async (rawText) => {
    scannedMatric.value = null;
    scanWarning.value = null;
    if (logTimeout) clearTimeout(logTimeout);

    const cleanText = rawText.trim().toUpperCase();
    const currentScanType =
      eventStatus.value === "SIGN_OUT_ACTIVE" ? "SIGN_OUT" : "SIGN_IN";

    try {
      // FIXED: Ensure we only flag duplicates for THIS specific event
      const existingRecord = await db.unsynced_scans
        .where({
          matric_number: cleanText,
          scan_type: currentScanType,
          eventId: selectedEventId.value,
        })
        .filter((record) => record.sync_status !== REJECTED_SYNC_STATUS)
        .first();

      if (existingRecord) {
        scanWarning.value = `Duplicate: ${cleanText} is already in the queue.`;
        playSound(errorAudio);
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        clearLogAfterDelay();
        return;
      }

      const newRecord = {
        id: crypto.randomUUID(),
        usher_id: user.value?.id ?? null,
        matric_number: cleanText,
        scan_type: currentScanType,
        timestamp: new Date().toISOString(),
        eventId: selectedEventId.value, // Properly tagged!
        sync_status: "pending",
      };

      await db.unsynced_scans.add(newRecord);

      playSound(scanSuccessAudio);
      scannedMatric.value = cleanText;
      // Update the UI queue locally; no full IndexedDB read is needed.
      unsyncedQueue.value = [newRecord, ...unsyncedQueue.value];
      await refreshPendingCount();
      if (navigator.vibrate) navigator.vibrate(200);
      if (isOnline.value) syncRecords();
      clearLogAfterDelay();
    } catch (error) {
      console.error("Failed to save scan locally", error);
      notifyErrorThrottled(
        "local-db",
        "Failed to save this scan locally. Please retry.",
        "Local DB Error",
      );
    }
  };

  // The Heartbeat Engine
  const startHeartbeat = () => {
    if (heartbeatInterval) return;

    const ping = async () => {
      if (!isOnline.value || heartbeatInFlight) return;

      heartbeatInFlight = true;
      try {
        // Silently ping the backend to update the last_active timestamp.
        await useApiFetch("/users/heartbeat", { method: "PATCH" });
      } catch (_) {
        // Heartbeats are best-effort.
      } finally {
        heartbeatInFlight = false;
      }
    };

    ping(); // Immediate first ping
    heartbeatInterval = setInterval(ping, 30000); // Repeat every 30 seconds
  };

  // Setup Online/Offline listeners
  const setOnline = () => {
    isOnline.value = true;
    syncRecords();
  };

  const setOffline = () => {
    isOnline.value = false;
    // Abort an in-flight request immediately so isSyncing cannot stay stuck
    // until the network timeout elapses.
    syncController?.abort();
  };

  onMounted(() => {
    scanSuccessAudio = new Audio(scanSuccessAudioUrl);
    syncSuccessAudio = new Audio(syncSuccessAudioUrl);
    errorAudio = new Audio(errorAudioUrl);

    scanSuccessAudio.preload = "auto";
    syncSuccessAudio.preload = "auto";
    errorAudio.preload = "auto";

    isOnline.value = navigator.onLine;
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    loadQueue()
      .then(() => {
        if (isOnline.value) syncRecords();
      })
      .catch((error) => {
        console.error("Failed to load local queue", error);
        notifyErrorThrottled(
          "load-queue",
          "Failed to load locally saved scans.",
          "Local DB Error",
        );
      });

    startHeartbeat();
  });

  onBeforeUnmount(() => {
    if (logTimeout) clearTimeout(logTimeout);
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    syncController?.abort();

    if (scanSuccessAudio) {
      scanSuccessAudio.pause();
      scanSuccessAudio = null;
    }

    if (syncSuccessAudio) {
      syncSuccessAudio.pause();
      syncSuccessAudio = null;
    }

    if (errorAudio) {
      errorAudio.pause();
      errorAudio = null;
    }

    window.removeEventListener("online", setOnline);
    window.removeEventListener("offline", setOffline);
  });

  const clearQueue = async () => {
    const isConfirmed = await confirmDialog.ask({
      title: "Clear Queue?",
      message:
        "WARNING: This will permanently delete all unsynced scans from this device. They will NOT be saved to the database. Are you absolutely sure?",
      confirmText: "Yes, Delete Everything",
      cancelText: "Cancel",
      isDestructive: true,
    });

    if (!isConfirmed) return;

    try {
      await db.unsynced_scans.clear();
      unsyncedQueue.value = [];
      syncErrors.value = [];
      await refreshPendingCount();
    } catch (error) {
      notifyErrorThrottled(
        "clear-queue",
        "Failed to clear queue. Please refresh the page.",
        "Local DB Error",
      );
    }
  };

  return {
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
  };
};
