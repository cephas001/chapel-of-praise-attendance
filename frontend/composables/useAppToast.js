import { useState } from "#app";

export const useAppToast = () => {
  // Global state holding our array of active toast notifications
  const toasts = useState("global-toasts", () => []);

  const remove = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const add = ({ title, message, type = "info", duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString();

    toasts.value.push({ id, title, message, type });

    // Auto-clear the toast after the specified duration
    if (duration) {
      setTimeout(() => remove(id), duration);
    }
  };

  // Helper functions so you don't have to pass the 'type' manually every time
  const success = (message, title = "Success") =>
    add({ title, message, type: "success" });

  const error = (message, title = "Error") =>
    add({ title, message, type: "error", duration: 6000 }); // Errors stay slightly longer

  const info = (message, title = "Info") =>
    add({ title, message, type: "info" });

  // NEW: Warning setup specifically styled for Live Alerts
  const warning = (message, title = "Alert") =>
    add({ title, message, type: "warning", duration: 8000 }); // 8 seconds so they can read the dispatch

  return {
    toasts,
    remove,
    success,
    error,
    info,
    warning,
  };
};
