import { ref, computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useToast } from "~/composables/useToast";

const inbox = ref([]);
let eventSource = null;
let alertAudio = null;

export const useMessages = () => {
  const { token } = useAuth();
  const toast = useToast();
  const config = useRuntimeConfig();

  // Computed property for the red notification badge
  const unreadCount = computed(() => {
    return inbox.value.filter((msg) => !msg.is_read).length;
  });

  const loadInbox = async () => {
    try {
      const data = await useApiFetch("/messages/my-inbox");
      inbox.value = data || [];
    } catch (error) {
      console.error("Failed to load inbox:", error);
    }
  };

  const markAsRead = async (messageId) => {
    // Optimistic UI update
    const msg = inbox.value.find((m) => m.id === messageId);
    if (msg) msg.is_read = true;

    try {
      await useApiFetch(`/messages/${messageId}/read`, { method: "PATCH" });
    } catch (error) {
      if (msg) msg.is_read = false; // Revert on failure
    }
  };

  const deleteMessage = async (messageId) => {
    // Optimistic UI update
    const previousInbox = [...inbox.value];
    inbox.value = inbox.value.filter((m) => m.id !== messageId);

    try {
      await useApiFetch(`/messages/${messageId}`, { method: "DELETE" });
      toast.success("Message deleted");
    } catch (error) {
      inbox.value = previousInbox; // Revert on failure
      toast.error("Failed to delete message");
    }
  };

  // ==========================================
  // THE LIVE SSE LISTENER
  // ==========================================
  const startListening = () => {
    if (eventSource || !token.value) return;

    // Load the audio file (same logic as the scanner!)
    const audioUrl = new URL("../assets/audio/scan1.mp3", import.meta.url).href;
    alertAudio = new Audio(audioUrl);
    alertAudio.preload = "auto";

    // Initialize the Server-Sent Events connection
    // Note: We have to pass the token in the URL query string because EventSource
    // doesn't natively support custom Authorization headers.
    // (Make sure your backend authenticateToken middleware can read from req.query.token as a fallback!)
    const baseUrl = config.public.apiBase;

    eventSource = new EventSource(
      `${baseUrl}/messages/stream?token=${token.value}`,
    );

    eventSource.onmessage = (event) => {
      // Ignore the empty ping messages used to keep the connection alive
      if (event.data === ": ping") return;

      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "NEW_MESSAGE") {
          // 1. Play Sound
          if (alertAudio) {
            alertAudio.currentTime = 0;
            alertAudio.play().catch(() => {}); // Catch autoplay restrictions
          }

          // 2. Vibrate Device
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

          // 3. Show Toast Alert
          toast.warning(`NEW ALERT: ${payload.title}`, payload.body);

          // 4. Refresh the inbox to grab the saved database row
          loadInbox();
        }
      } catch (err) {
        console.error("SSE Parse Error:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE Connection lost. Reconnecting...");
      eventSource.close();
      eventSource = null;
      // Attempt to reconnect after 5 seconds
      setTimeout(startListening, 5000);
    };
  };

  const stopListening = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  return {
    inbox,
    unreadCount,
    loadInbox,
    markAsRead,
    deleteMessage,
    startListening,
    stopListening,
  };
};
