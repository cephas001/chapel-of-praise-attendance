import { onMounted, onBeforeUnmount } from "vue";
import { useAuth } from "~/composables/useAuth";

// Helper function required by the Web Push protocol to format your Public Key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useWebPush = () => {
  const { token } = useAuth();

  // Import your custom notification sound here
  const alertAudioUrl = new URL("../assets/audio/scan1.mp3", import.meta.url)
    .href;
  let alertAudio = null;

  const playNotificationSound = () => {
    if (!alertAudio) return;
    try {
      alertAudio.currentTime = 0;
      const playPromise = alertAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.warn(
            "Browser blocked audio autoplay. User must interact with page first.",
          );
        });
      }
    } catch (e) {
      console.error("Audio play error", e);
    }
  };

  const handleServiceWorkerMessage = (event) => {
    if (event.data && event.data.type === "PLAY_NOTIFICATION_SOUND") {
      playNotificationSound();
    }
  };

  const initPushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported by this browser.");
      return;
    }

    try {
      // 1. Register the Service Worker (if not already handled by Vite PWA)
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 2. Ask for permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied.");
        return;
      }

      // 3. Subscribe the device using your Public Key from the .env file
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // 4. Send the subscription object to your Express backend
      if (token.value) {
        await useApiFetch("/notifications/subscribe", {
          method: "POST",
          body: subscription,
        });
        console.log("Successfully subscribed to push notifications!");
      }
    } catch (error) {
      console.error("Error initializing push notifications:", error);
    }
  };

  onMounted(() => {
    alertAudio = new Audio(alertAudioUrl);
    alertAudio.preload = "auto";

    // Listen for the silent ping from the Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    }
  });

  onBeforeUnmount(() => {
    if (alertAudio) {
      alertAudio.pause();
      alertAudio = null;
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
    }
  });

  return {
    initPushNotifications,
  };
};
