<template>
  <section aria-label="Event register" class="min-w-0">
    <div class="flex items-baseline justify-between gap-4">
      <h2 class="led-eyebrow">events</h2>
      <span class="led-eyebrow">{{ countLabel }}</span>
    </div>

    <p v-if="isLoading && events.length === 0" class="led-eyebrow mt-5">
      loading…
    </p>

    <p
      v-else-if="events.length === 0"
      class="mt-5 max-w-xs text-sm leading-relaxed text-muted"
    >
      {{ emptyMessage }}
    </p>

    <button
      v-if="selectedEvent && !isOpen"
      type="button"
      class="mt-4 flex w-full items-center justify-between gap-4 border-y border-rule bg-inset py-3.5 pl-3 pr-2 text-left lg:hidden"
      @click="$emit('update:isOpen', true)"
    >
      <span class="min-w-0">
        <span class="led-eyebrow block">{{
          formatDate(selectedEvent.date)
        }}</span>
        <span class="mt-1 block truncate text-[15px] font-semibold text-ink">
          {{ selectedEvent.name }}
        </span>
      </span>
      <span class="led-eyebrow shrink-0 text-chapel">change</span>
    </button>

    <ul
      v-if="events.length > 0"
      class="mt-4 max-h-[26rem] overflow-y-auto border-t border-rule"
      :class="{ 'hidden lg:block': selectedEvent && !isOpen }"
    >
      <li v-for="event in events" :key="event.id" class="border-b border-rule">
        <button
          type="button"
          class="flex w-full items-start justify-between gap-4 py-3.5 pl-3 pr-2 text-left transition-colors"
          :class="
            selectedId === event.id
              ? 'bg-inset shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'hover:bg-inset/60'
          "
          :aria-pressed="selectedId === event.id"
          @click="$emit('select', event)"
        >
          <span class="min-w-0">
            <span class="led-eyebrow block">{{ formatDate(event.date) }}</span>
            <span
              class="mt-1 block text-[15px] font-semibold leading-snug text-ink"
            >
              {{ event.name }}
            </span>
            <span
              v-if="showStatus && event.status"
              class="led-eyebrow mt-1.5 flex items-center gap-1.5"
            >
              <span
                class="h-1.5 w-1.5 shrink-0 rounded-[1px]"
                :class="getEventStatus(event.status).dotClass"
              ></span>
              {{ getEventStatus(event.status).label.toLowerCase() }}
            </span>
          </span>

          <span
            v-if="selectedId === event.id"
            class="led-eyebrow mt-0.5 shrink-0 text-chapel"
            >open</span
          >
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { getEventStatus } from "~/composables/useStatus";

const props = defineProps({
  events: { type: Array, required: true },
  selectedId: { type: [String, Number], default: null },
  isLoading: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: true },
  showStatus: { type: Boolean, default: false },
  emptyMessage: {
    type: String,
    default: "No active events. Events appear here once an admin opens them.",
  },
});

defineEmits(["select", "update:isOpen"]);

const selectedEvent = computed(() =>
  props.events.find((event) => event.id === props.selectedId),
);

const countLabel = computed(() => {
  if (props.isLoading && props.events.length === 0) return "";
  return `${props.events.length} events`;
});

const formatDate = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed
    .toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toLowerCase();
};
</script>
