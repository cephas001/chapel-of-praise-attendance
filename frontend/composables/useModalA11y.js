import { nextTick, onBeforeUnmount, watch } from "vue";
import { useOverlayState } from "./useOverlayState";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Adds dialog keyboard behavior to a modal/drawer:
 * - traps Tab / Shift+Tab inside the container
 * - closes on Escape
 * - moves focus into the container when it opens
 * - restores focus to the trigger when it closes
 *
 * Only the topmost overlay handles keyboard events, so nested modals do not
 * both close when Escape is pressed.
 */
export const useModalA11y = (isOpen, containerRef, options = {}) => {
  const { register, unregister, isTop } = useOverlayState();
  const token = Symbol("overlay");
  let previouslyFocused = null;
  let registered = false;

  const getFocusableItems = () =>
    Array.from(
      containerRef.value?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [],
    ).filter((element) => {
      if (element.getAttribute("aria-hidden") === "true") return false;
      return (
        element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element.getClientRects().length > 0
      );
    });

  const handleKeydown = (event) => {
    if (!isTop(token)) return;

    if (event.key === "Escape") {
      event.preventDefault();
      options.onClose?.();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableItems();
    const activeElement = document.activeElement;

    if (!focusable.length) {
      event.preventDefault();
      containerRef.value?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (activeElement === first || !containerRef.value?.contains(activeElement)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last || !containerRef.value?.contains(activeElement)) {
      event.preventDefault();
      first.focus();
    }
  };

  const open = async () => {
    previouslyFocused = document.activeElement;
    registered = true;
    register(token);
    document.addEventListener("keydown", handleKeydown, true);

    await nextTick();
    if (!isOpen.value) return;

    const focusable = getFocusableItems();
    const requestedTarget = options.initialFocusSelector
      ? containerRef.value?.querySelector(options.initialFocusSelector)
      : null;

    (requestedTarget || focusable[0] || containerRef.value)?.focus?.();
  };

  const close = () => {
    if (registered) {
      unregister(token);
      registered = false;
    }

    document.removeEventListener("keydown", handleKeydown, true);

    if (
      previouslyFocused &&
      typeof previouslyFocused.focus === "function" &&
      document.contains(previouslyFocused)
    ) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  };

  watch(
    isOpen,
    (openState) => {
      if (openState) {
        open();
      } else {
        close();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (registered) {
      close();
      return;
    }
    document.removeEventListener("keydown", handleKeydown, true);
  });
};
