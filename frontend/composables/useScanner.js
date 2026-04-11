// frontend/composables/useScanner.js
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { db } from "~/utils/db";
import { useAuth } from "~/composables/useAuth";

export const useScanner = (selectedEventId, eventStatus) => {
  const { user, token } = useAuth();

  const isOnline = ref(true);
  const isSyncing = ref(false);
  const unsyncedQueue = ref([]);
  const syncErrors = ref([]);

  const scannedMatric = ref(null);
  const scanWarning = ref(null);
  let logTimeout = null;

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

          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          await db.unsynced_scans.delete(record.id);
        } else {
          console.error("Network died during sync loop:", error);
          break;
        }
      }
    }

    await loadQueue();
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
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]);
        clearLogAfterDelay();
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
      clearLogAfterDelay();
    } catch (error) {
      console.error("Local DB Error:", error);
    }
  };

  // Setup Online/Offline listeners
  const setOnline = () => (isOnline.value = true);
  const setOffline = () => (isOnline.value = false);

  onMounted(() => {
    isOnline.value = navigator.onLine;
    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);
    loadQueue().then(() => {
      if (isOnline.value) syncRecords();
    });
  });

  onBeforeUnmount(() => {
    if (logTimeout) clearTimeout(logTimeout);
    window.removeEventListener("online", setOnline);
    window.removeEventListener("offline", setOffline);
  });

  watch(isOnline, (newStatus) => {
    if (newStatus === true) syncRecords();
  });

  return {
    isOnline,
    isSyncing,
    unsyncedQueue,
    syncErrors,
    scannedMatric,
    scanWarning,
    handleScan,
    syncRecords,
  };
};
