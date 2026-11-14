import { computed, ref } from "vue";

// A single stack shared by every overlay (drawer and dialogs). The install
// prompt only needs to know whether any overlay is currently open.
const overlayStack = ref([]);

export const useOverlayState = () => {
  const hasOverlay = computed(() => overlayStack.value.length > 0);

  const register = (token) => {
    if (!overlayStack.value.includes(token)) {
      overlayStack.value = [...overlayStack.value, token];
    }
  };

  const unregister = (token) => {
    overlayStack.value = overlayStack.value.filter((entry) => entry !== token);
  };

  const isTop = (token) =>
    overlayStack.value[overlayStack.value.length - 1] === token;

  return { hasOverlay, register, unregister, isTop };
};
