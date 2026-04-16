import { ref } from "vue";

// Global state declared outside the composable so it's shared across the whole app
const isOpen = ref(false);
const title = ref("");
const message = ref("");
const confirmText = ref("Confirm");
const cancelText = ref("Cancel");
const isDestructive = ref(true); // Changes the confirm button to red if true
let resolvePromise = null;

export const useConfirm = () => {
  // Call this function from anywhere in your app to trigger the modal
  const ask = (options) => {
    title.value = options.title || "Are you sure?";
    message.value = options.message || "";
    confirmText.value = options.confirmText || "Confirm";
    cancelText.value = options.cancelText || "Cancel";
    isDestructive.value = options.isDestructive !== false;

    isOpen.value = true;

    // Returns a Promise that waits until the user clicks a button
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  // Called by the modal buttons to resolve the Promise and close the modal
  const respond = (answer) => {
    isOpen.value = false;
    if (resolvePromise) {
      resolvePromise(answer);
      resolvePromise = null; // Clean up
    }
  };

  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive,
    ask,
    respond,
  };
};
