<template>
  <span class="inline-flex shrink-0">
    <button
      ref="triggerRef"
      type="button"
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[2px] text-muted transition-colors duration-150 hover:bg-inset hover:text-ink"
      :class="{ 'bg-inset text-ink': isOpen }"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :aria-describedby="isOpen ? panelId : undefined"
      :aria-label="label"
      @click="toggle"
    >
      <Icon :name="icon" class="text-lg" />
    </button>

    <Teleport to="body">
      <Transition name="info-pop">
        <div
          v-if="isOpen"
          :id="panelId"
          ref="panelRef"
          role="region"
          aria-live="polite"
          :aria-label="label"
          class="fixed z-modal max-h-[calc(100vh-2rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto border border-rule bg-surface p-4 text-sm leading-relaxed text-muted shadow-lg"
          :style="panelStyle"
        >
          <slot>{{ text }}</slot>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "More information",
  },
  icon: {
    type: String,
    default: "material-symbols:info-outline",
  },
  align: {
    type: String,
    default: "end",
    validator: (value) => ["start", "end"].includes(value),
  },
});

const isOpen = ref(false);
const triggerRef = ref(null);
const panelRef = ref(null);
const panelStyle = ref({
  top: "0px",
  left: "0px",
  visibility: "hidden",
});
const panelId = `info-hint-${useId()}`;

let listenersBound = false;

const updatePosition = () => {
  const trigger = triggerRef.value;
  const panel = panelRef.value;

  if (!trigger || !panel) return;

  const gap = 8;
  const margin = 16;
  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  let top = triggerRect.bottom + gap;

  // Flip above the trigger when there is not enough room below.
  if (top + panelRect.height > window.innerHeight - margin) {
    top = Math.max(margin, triggerRect.top - panelRect.height - gap);
  }

  let left =
    props.align === "end"
      ? triggerRect.right - panelRect.width
      : triggerRect.left;

  // Keep the floating panel inside the viewport on narrow screens.
  left = Math.min(
    Math.max(margin, left),
    window.innerWidth - panelRect.width - margin,
  );

  panelStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    visibility: "visible",
  };
};

const handlePointerDown = (event) => {
  if (
    triggerRef.value?.contains(event.target) ||
    panelRef.value?.contains(event.target)
  ) {
    return;
  }

  isOpen.value = false;
};

const handleKeydown = (event) => {
  if (event.key !== "Escape") return;

  event.preventDefault();
  isOpen.value = false;
  triggerRef.value?.focus();
};

const bindListeners = () => {
  if (listenersBound) return;

  document.addEventListener("pointerdown", handlePointerDown, true);
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  listenersBound = true;
};

const unbindListeners = () => {
  if (!listenersBound) return;

  document.removeEventListener("pointerdown", handlePointerDown, true);
  document.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  listenersBound = false;
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

watch(isOpen, async (open) => {
  if (!open) {
    unbindListeners();
    return;
  }

  panelStyle.value = {
    top: "0px",
    left: "0px",
    visibility: "hidden",
  };

  await nextTick();
  updatePosition();
  bindListeners();
});

onBeforeUnmount(unbindListeners);
</script>

<style scoped>
.info-pop-enter-active,
.info-pop-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.info-pop-enter-from,
.info-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
