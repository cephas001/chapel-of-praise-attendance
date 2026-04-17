// frontend/composables/useScanner.js
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { db } from "~/utils/db";
import { useAuth } from "~/composables/useAuth";
import { useToast } from "~/composables/useToast";
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

export const useScanner = (selectedEventId, eventStatus) => {
  const { user, token } = useAuth();
  const toast = useToast();
  const confirmDialog = useConfirm();

  const isOnline = ref(true);
  const isSyncing = ref(false);
  const unsyncedQueue = ref([]);
  const syncErrors = ref([]);

  const scannedMatric = ref(null);
  const scanWarning = ref(null);
  let logTimeout = null;
  let scanSuccessAudio = null;
  let syncSuccessAudio = null;
  let errorAudio = null;
  let heartbeatInterval = null;

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

  const loadQueue = async () => {
    const records = await db.unsynced_scans.toArray();
    unsyncedQueue.value = records.reverse();
  };

  // The Sync Engine
  const syncRecords = async () => {
    if (
      isSyncing.value ||
      unsyncedQueue.value.length === 0 ||
      !isOnline.value ||
      !selectedEventId.value
    )
      return;

    isSyncing.value = true;
    const recordsToProcess = [...unsyncedQueue.value];
    let successfulSyncCount = 0;
    let syncAborted = false;

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

        await db.unsynced_scans.delete(record.id);
        successfulSyncCount += 1;
      } catch (error) {
        const status = error.statusCode || error.response?.status;
        if (status === 409 || status === 403) {
          const errorData = error.data || {};
          syncErrors.value.unshift({
            id: Date.now() + Math.random(),
            matric: record.matric_number,
            message:
              errorData.message || errorData.error || "Rejected by server.",
          });

          playSound(errorAudio);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          await db.unsynced_scans.delete(record.id);
        } else {
          toast.error("Network died during sync loop:", error);
          syncAborted = true;
          break;
        }
      }
    }

    await loadQueue();
    if (successfulSyncCount > 0 && !syncAborted) {
      playSound(syncSuccessAudio);
    }
    isSyncing.value = false;
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
      const existingRecord = await db.unsynced_scans
        .where({ matric_number: cleanText, scan_type: currentScanType })
        .first();

      if (existingRecord) {
        scanWarning.value = `Duplicate: ${cleanText} is already in the queue.`;
        playSound(errorAudio);
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        clearLogAfterDelay();
        return;
      }

      await db.unsynced_scans.add({
        matric_number: cleanText,
        scan_type: currentScanType,
        timestamp: new Date().toISOString(),
      });

      playSound(scanSuccessAudio);
      scannedMatric.value = cleanText;
      await loadQueue();
      if (navigator.vibrate) navigator.vibrate(200);
      if (isOnline.value) syncRecords();
      clearLogAfterDelay();
    } catch (error) {
      toast.error("Local DB Error:", error);
    }
  };

  // The Heartbeat Engine
  const startHeartbeat = () => {
    if (heartbeatInterval) return;

    const ping = () => {
      // Silently ping the backend to update the last_active timestamp
      if (isOnline.value) {
        useApiFetch("/users/heartbeat", { method: "PATCH" }).catch(() => {});
      }
    };

    ping(); // Immediate first ping
    heartbeatInterval = setInterval(ping, 30000); // Repeat every 30 seconds
  };

  // Setup Online/Offline listeners
  const setOnline = () => (isOnline.value = true);
  const setOffline = () => (isOnline.value = false);

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

    loadQueue().then(() => {
      if (isOnline.value) syncRecords();
    });

    startHeartbeat();
  });

  onBeforeUnmount(() => {
    if (logTimeout) clearTimeout(logTimeout);
    if (heartbeatInterval) clearInterval(heartbeatInterval);

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

  watch(isOnline, (newStatus) => {
    if (newStatus === true) syncRecords();
  });

  const clearQueue = async () => {
    const isConfirmed = await confirmDialog.ask({
      title: "Clear Queue?",
      message:
        "⚠️ WARNING: This will permanently delete all unsynced scans from this device. They will NOT be saved to the database. Are you absolutely sure?",
      confirmText: "Yes, Delete Everything",
      cancelText: "Cancel",
      isDestructive: true,
    });

    if (!isConfirmed) return;

    try {
      await db.unsynced_scans.clear();
      await loadQueue();
    } catch (error) {
      toast.error("Failed to clear queue. Please refresh the page.");
    }
  };

  return {
    isOnline,
    isSyncing,
    unsyncedQueue,
    syncErrors,
    scannedMatric,
    scanWarning,
    handleScan,
    syncRecords,
    clearQueue,
  };
};
