import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useAppToast } from "~/composables/useAppToast";

const INBOX_PAGE_SIZE = 20;

const inbox = ref([]);
const unreadCount = ref(0);
const inboxPagination = ref({
  total: 0,
  limit: INBOX_PAGE_SIZE,
  offset: 0,
  nextOffset: 0,
  hasMore: false,
});
const inboxLoaded = ref(false);
const isSseConnected = ref(false);
const lastStatusEvent = ref(null);

let eventSource = null;
let alertAudio = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let reconnectPending = false;
let lifecycleHandlers = null;

// Reconnect cadence: 5s -> 10s -> 30s -> 60s, with ±20% jitter.
const RECONNECT_DELAYS_MS = [5000, 10000, 30000, 60000];

const shouldPauseReconnect = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  if (typeof document !== "undefined" && document.hidden) {
    return true;
  }

  return false;
};

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const getReconnectDelay = () => {
  const base =
    RECONNECT_DELAYS_MS[
      Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)
    ];
  const jitter = 0.8 + Math.random() * 0.4;

  return Math.round(base * jitter);
};

const mergeMessageIntoInbox = (message) => {
  if (!message?.id) return false;

  const existingIndex = inbox.value.findIndex((item) => item.id === message.id);

  if (existingIndex === -1) {
    inbox.value = [message, ...inbox.value];
    return true;
  }

  const nextInbox = [...inbox.value];
  nextInbox[existingIndex] = {
    ...nextInbox[existingIndex],
    ...message,
  };
  inbox.value = nextInbox;
  return false;
};

export const useMessages = () => {
  const { token } = useAuth();
  const toast = useAppToast();
  const config = useRuntimeConfig();

  // Fetch only the badge count on boot instead of the whole inbox.
  const loadUnreadCount = async () => {
    try {
      const data = await useApiFetch("/messages/unread-count");
      unreadCount.value =
        typeof data?.unreadCount === "number" ? data.unreadCount : 0;
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const loadInbox = async (options = {}) => {
    const append = options?.append === true;

    try {
      // Use the current cached length, not a stale page cursor. SSE messages
      // are inserted at the front of the inbox and would otherwise shift an
      // offset-based page and cause an item to be skipped or duplicated.
      const offset = append ? inbox.value.length : 0;
      const data = await useApiFetch(
        `/messages/my-inbox?limit=${INBOX_PAGE_SIZE}&offset=${offset}`,
      );

      const messages = Array.isArray(data) ? data : data?.messages || [];

      if (append) {
        const existingIds = new Set(inbox.value.map((message) => message.id));
        inbox.value = [
          ...inbox.value,
          ...messages.filter((message) => !existingIds.has(message.id)),
        ];
      } else {
        inbox.value = messages;
      }

      inboxLoaded.value = true;

      if (!Array.isArray(data) && data?.pagination) {
        inboxPagination.value = {
          ...data.pagination,
          nextOffset: inbox.value.length,
        };
      } else {
        inboxPagination.value = {
          total: messages.length,
          limit: INBOX_PAGE_SIZE,
          offset,
          nextOffset: inbox.value.length,
          hasMore: false,
        };
      }

      if (!Array.isArray(data) && typeof data?.unreadCount === "number") {
        unreadCount.value = data.unreadCount;
      } else if (!append) {
        unreadCount.value = messages.filter(
          (message) => !message.is_read,
        ).length;
      }
    } catch (error) {
      console.error("Failed to load inbox:", error);
    }
  };

  const loadMoreInbox = () => loadInbox({ append: true });

  const clearInbox = () => {
    inbox.value = [];
    unreadCount.value = 0;
    inboxLoaded.value = false;
    inboxPagination.value = {
      total: 0,
      limit: INBOX_PAGE_SIZE,
      offset: 0,
      nextOffset: 0,
      hasMore: false,
    };
    lastStatusEvent.value = null;
  };

  const markAsRead = async (messageId) => {
    const msg = inbox.value.find((m) => m.id === messageId);
    const wasUnread = Boolean(msg && !msg.is_read);

    // Optimistic UI update
    if (msg) msg.is_read = true;
    if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1);

    try {
      await useApiFetch(`/messages/${messageId}/read`, { method: "PATCH" });
    } catch (error) {
      if (msg) msg.is_read = false; // Revert on failure
      if (wasUnread) unreadCount.value += 1;
    }
  };

  const deleteMessage = async (messageId) => {
    const msg = inbox.value.find((m) => m.id === messageId);
    const wasUnread = Boolean(msg && !msg.is_read);
    const previousInbox = [...inbox.value];
    const previousPagination = { ...inboxPagination.value };

    // Optimistic UI update
    inbox.value = inbox.value.filter((m) => m.id !== messageId);
    if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1);
    inboxPagination.value = {
      ...inboxPagination.value,
      total: Math.max(0, inboxPagination.value.total - 1),
    };

    try {
      await useApiFetch(`/messages/${messageId}`, { method: "DELETE" });
      toast.success("Message deleted");
    } catch (error) {
      inbox.value = previousInbox; // Revert on failure
      inboxPagination.value = previousPagination;
      if (wasUnread) unreadCount.value += 1;
      toast.error("Failed to delete message");
    }
  };

  const unbindLifecycleListeners = () => {
    if (!lifecycleHandlers || typeof window === "undefined") return;

    window.removeEventListener("online", lifecycleHandlers.online);
    window.removeEventListener("offline", lifecycleHandlers.offline);
    document.removeEventListener(
      "visibilitychange",
      lifecycleHandlers.visibilityChange,
    );
    lifecycleHandlers = null;
  };

  const bindLifecycleListeners = () => {
    if (lifecycleHandlers || typeof window === "undefined") return;

    lifecycleHandlers = {
      online: () => {
        if (!token.value) return;

        reconnectAttempt = 0;
        reconnectPending = false;

        if (!eventSource) startListening();
      },
      offline: () => {
        isSseConnected.value = false;
        reconnectPending = Boolean(token.value);
        clearReconnectTimer();

        if (eventSource) {
          const source = eventSource;
          eventSource = null;
          source.close();
        }
      },
      visibilityChange: () => {
        if (!token.value) return;

        if (document.hidden) {
          // Pause an already scheduled retry while the tab is in the background.
          if (reconnectTimer) {
            clearReconnectTimer();
            reconnectPending = true;
          }
          return;
        }

        if (reconnectPending && !eventSource) {
          reconnectAttempt = 0;
          reconnectPending = false;
          startListening();
        }
      },
    };

    window.addEventListener("online", lifecycleHandlers.online);
    window.addEventListener("offline", lifecycleHandlers.offline);
    document.addEventListener(
      "visibilitychange",
      lifecycleHandlers.visibilityChange,
    );
  };

  const scheduleReconnect = () => {
    if (!token.value || reconnectTimer) return;

    // Do not burn attempts while offline or while the tab is hidden. The
    // online/visibilitychange listeners resume the connection.
    if (shouldPauseReconnect()) {
      reconnectPending = true;
      return;
    }

    const delay = getReconnectDelay();
    reconnectAttempt = Math.min(
      reconnectAttempt + 1,
      RECONNECT_DELAYS_MS.length - 1,
    );

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;

      if (!token.value) return;

      if (shouldPauseReconnect()) {
        reconnectPending = true;
        return;
      }

      reconnectPending = false;
      startListening();
    }, delay);
  };

  // ==========================================
  // THE LIVE SSE LISTENER
  // ==========================================
  const startListening = () => {
    if (eventSource || !token.value) return;

    bindLifecycleListeners();
    clearReconnectTimer();

    if (shouldPauseReconnect()) {
      reconnectPending = true;
      return;
    }

    reconnectPending = false;

    // Load the audio file once (same logic as the scanner!)
    if (!alertAudio) {
      const audioUrl = new URL("../assets/audio/scan1.mp3", import.meta.url)
        .href;
      alertAudio = new Audio(audioUrl);
      alertAudio.preload = "auto";
    }

    // EventSource cannot send custom Authorization headers, so the backend
    // auth middleware accepts the JWT from the query string as a fallback.
    const baseUrl = config.public.apiBase;
    const streamUrl = `${baseUrl}/messages/stream?token=${encodeURIComponent(
      token.value,
    )}`;

    let source = null;

    try {
      source = new EventSource(streamUrl);
      eventSource = source;
    } catch (error) {
      console.error("Failed to open SSE connection:", error);
      eventSource = null;
      reconnectPending = true;
      scheduleReconnect();
      return;
    }

    source.onopen = () => {
      // Ignore callbacks from a stream that has already been replaced or closed.
      if (eventSource !== source) return;

      isSseConnected.value = true;
      reconnectAttempt = 0;
      reconnectPending = false;
    };

    source.onmessage = (event) => {
      if (eventSource !== source) return;

      // Ignore empty keep-alive comments.
      if (!event.data || event.data.startsWith(":")) return;

      try {
        const payload = JSON.parse(event.data);

        if (payload.type === "NEW_MESSAGE") {
          const message = payload.message;
          const title = message?.title ?? payload.title;
          const body = message?.body ?? payload.body;

          // 1. Update the cached inbox directly with the payload. This avoids
          // re-downloading the entire inbox for every single message.
          if (message?.id) {
            if (inboxLoaded.value) {
              const alreadyInInbox = inbox.value.some(
                (item) => item.id === message.id,
              );
              mergeMessageIntoInbox(message);
              if (!alreadyInInbox && !message.is_read) {
                unreadCount.value += 1;
              }
            } else {
              // The inbox has not been opened yet; refresh only the badge.
              loadUnreadCount();
            }
          } else {
            // Backward compatibility with older servers.
            loadInbox();
          }

          // 2. Play Sound
          if (alertAudio) {
            alertAudio.currentTime = 0;
            alertAudio.play().catch(() => {}); // Catch autoplay restrictions
          }

          // 3. Vibrate Device
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

          // 4. Show Toast Alert
          toast.warning(`NEW ALERT: ${title}`, body);
          return;
        }

        if (payload.type === "EVENT_STATUS") {
          // The scanner watches this ref and applies the transition instantly.
          lastStatusEvent.value = {
            ...payload,
            receivedAt: Date.now(),
          };
        }
      } catch (err) {
        console.error("SSE Parse Error:", err);
      }
    };

    source.onerror = () => {
      if (eventSource !== source) return;

      console.warn("SSE connection lost. Reconnecting...");
      eventSource = null;
      source.close();
      isSseConnected.value = false;

      if (!token.value) return;

      reconnectPending = true;
      scheduleReconnect();
    };
  };

  const stopListening = () => {
    clearReconnectTimer();
    reconnectAttempt = 0;
    reconnectPending = false;
    isSseConnected.value = false;

    if (eventSource) {
      const source = eventSource;
      eventSource = null;
      source.close();
    }

    unbindLifecycleListeners();
  };

  return {
    inbox,
    unreadCount,
    inboxPagination,
    isSseConnected,
    lastStatusEvent,
    loadInbox,
    loadMoreInbox,
    loadUnreadCount,
    clearInbox,
    markAsRead,
    deleteMessage,
    startListening,
    stopListening,
  };
};
