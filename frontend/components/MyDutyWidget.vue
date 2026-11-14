<template>
  <div class="border-t border-rule">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-4 py-4 text-left"
      :aria-expanded="isOpen"
      aria-controls="my-duty-body"
      @click="isOpen = !isOpen"
    >
      <span class="min-w-0">
        <span class="led-eyebrow block">your post</span>
        <span class="mt-1 block text-[15px] font-semibold text-ink"
          >Duty assignment</span
        >
      </span>
      <span class="led-eyebrow shrink-0 lg:hidden">{{
        isOpen ? "hide" : "show"
      }}</span>
    </button>

    <div id="my-duty-body" :class="{ 'hidden lg:block': !isOpen }">
      <p v-if="isLoading" class="led-eyebrow pb-4">loading…</p>

      <p
        v-else-if="assignments.length === 0"
        class="max-w-sm pb-4 text-sm leading-relaxed text-muted"
      >
        No primary post for this event. Assist wherever you can.
      </p>

      <div v-else class="pb-2">
        <div v-if="arrangerTasks.length > 0">
          <p class="led-eyebrow pb-1">arrangement</p>
          <div
            v-for="task in arrangerTasks"
            :key="task.id"
            class="flex items-baseline justify-between gap-4 border-t border-rule py-2.5"
          >
            <span class="text-sm font-semibold text-ink">{{
              task.zone_name
            }}</span>
            <span class="led-eyebrow shrink-0">arrange</span>
          </div>
        </div>

        <div v-if="scannerTasks.length > 0" class="mt-4">
          <p class="led-eyebrow pb-1">scanning</p>

          <div
            v-for="task in primaryScannerTasks"
            :key="task.id"
            class="flex items-baseline justify-between gap-4 border-t border-rule py-2.5"
          >
            <span class="text-sm font-semibold text-ink">{{
              task.zone_name
            }}</span>
            <span
              class="led-eyebrow flex shrink-0 items-center gap-1.5 text-status-live"
            >
              <span class="h-1.5 w-1.5 rounded-[1px] bg-status-live"></span>
              primary
            </span>
          </div>

          <div
            v-for="task in secondaryScannerTasks"
            :key="task.id"
            class="flex items-baseline justify-between gap-4 border-t border-rule py-2.5"
          >
            <span class="text-sm font-semibold text-ink">{{
              task.zone_name
            }}</span>
            <span class="led-eyebrow shrink-0">low traffic</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuth } from "~/composables/useAuth";

const props = defineProps({
  eventId: {
    type: String,
    required: true,
  },
});

const { user } = useAuth();

const isOpen = ref(false);

const getCacheKey = (eventId) =>
  `cache_my_duty_${user.value?.id ?? "anon"}_${eventId}`;

const readCache = (eventId) => {
  if (!import.meta.client || !eventId) return null;

  try {
    const raw = localStorage.getItem(getCacheKey(eventId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
};

const writeCache = (eventId, data) => {
  if (!import.meta.client || !eventId) return;

  try {
    localStorage.setItem(getCacheKey(eventId), JSON.stringify(data));
  } catch (_) {
    // Cache writes are best-effort (private mode / quota exhaustion).
  }
};

// Paint the previously cached assignment immediately, then revalidate.
const cachedAssignments = readCache(props.eventId);
const assignments = ref(cachedAssignments ?? []);
const isLoading = ref(cachedAssignments === null);

let requestId = 0;

const fetchData = async () => {
  const eventId = props.eventId;
  if (!eventId) return;

  const currentRequest = ++requestId;

  try {
    const data = await useApiFetch(`/roster/${eventId}/my-duty`);

    // Ignore a stale response if the event changed while this was in flight.
    if (currentRequest !== requestId || props.eventId !== eventId) return;

    assignments.value = Array.isArray(data) ? data : [];
    writeCache(eventId, assignments.value);
  } catch (error) {
    console.error("Failed to fetch duty", error);
  } finally {
    if (currentRequest === requestId) isLoading.value = false;
  }
};

// Computed properties to cleanly split the tasks for the UI
const arrangerTasks = computed(() =>
  assignments.value.filter((a) => a.task_type === "ARRANGER"),
);
const scannerTasks = computed(() =>
  assignments.value.filter((a) => a.task_type === "SCANNER"),
);

const primaryScannerTasks = computed(() =>
  scannerTasks.value.filter((a) => a.is_primary),
);
const secondaryScannerTasks = computed(() =>
  scannerTasks.value.filter((a) => !a.is_primary),
);

onMounted(() => {
  // With a cache hit this is a silent background revalidation.
  fetchData();
});

watch(
  () => props.eventId,
  (eventId) => {
    const cached = readCache(eventId);

    assignments.value = cached ?? [];
    isLoading.value = cached === null;

    fetchData();
  },
);
</script>
