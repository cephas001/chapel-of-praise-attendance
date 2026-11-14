<template>
  <div class="min-h-screen bg-canvas pb-24 font-sans text-ink">
    <main class="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
      <LedgerPageHeader eyebrow="roster records" title="Event rosters">
        <template #actions>
          <button
            type="button"
            @click="loadActiveEvents"
            :disabled="isLoadingEvents"
            class="led-eyebrow inline-flex min-h-11 items-center gap-1.5 py-2 transition-colors hover:text-ink disabled:opacity-50"
            aria-label="Refresh roster data"
          >
            <Icon
              name="material-symbols:refresh"
              class="text-base"
              :class="{ 'animate-spin': isLoadingEvents }"
            />
            {{ isLoadingEvents ? "refreshing" : "refresh" }}
          </button>
        </template>
      </LedgerPageHeader>

      <div
        class="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-12 lg:gap-0 lg:pt-10"
      >
        <div class="lg:col-span-4 lg:pr-8">
          <LedgerEventRegister
            v-model:isOpen="isRegistryOpen"
            :events="activeEvents"
            :selectedId="selectedEvent?.id"
            :isLoading="isLoadingEvents"
            @select="selectEvent"
          />
        </div>

        <div class="lg:col-span-8 lg:border-l lg:border-rule lg:pl-8">
          <div v-if="!selectedEvent" class="lg:min-h-[22rem]">
            <p class="led-eyebrow">no event selected</p>
            <h2 class="led-display mt-2 max-w-sm text-[28px] sm:text-[32px]">
              Choose an event to see its roster.
            </h2>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Only events that are currently open appear here.
            </p>
          </div>

          <template v-else>
            <LedgerPhaseBar
              :name="selectedEvent.name"
              context="live roster"
              dotClass="bg-status-live"
              @close="clearSelection"
            />

            <p v-if="isLoadingRoster" class="led-eyebrow py-6">
              loading roster…
            </p>

            <div
              v-else-if="
                !currentRosterData ||
                currentRosterData.proposedAssignments.length === 0
              "
              class="py-10"
            >
              <p class="led-eyebrow">not published</p>
              <h2 class="led-display mt-2 max-w-sm text-[28px]">
                No roster published.
              </h2>
              <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                An admin has not generated and published assignments for this
                event yet.
              </p>
            </div>

            <div v-else class="pt-6">
              <AdminRosterReview
                :eventId="selectedEvent.id"
                :proposal="currentRosterData"
                :isReadonly="true"
              />
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAppToast } from "~/composables/useAppToast";
import AdminRosterReview from "~/components/Admin/RosterReview.vue";

const toast = useAppToast();

const activeEvents = ref([]);
const isLoadingEvents = ref(false);

const isRegistryOpen = ref(true);
const selectedEvent = ref(null);

const currentRosterData = ref(null);
const isLoadingRoster = ref(false);
const isRosterReviewOpen = ref(true);

const loadActiveEvents = async () => {
  isLoadingEvents.value = true;
  try {
    const data = await useApiFetch("/events/active");
    activeEvents.value = data.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    toast.error("Couldn't load events. Check your connection and try again.");
    console.error(error);
  } finally {
    isLoadingEvents.value = false;
  }
};

const selectEvent = async (event) => {
  selectedEvent.value = event;

  // Professional UX: Close left menu on mobile to show the new content
  if (window.innerWidth < 1024) {
    isRegistryOpen.value = false;
  }

  isLoadingRoster.value = true;
  currentRosterData.value = null;
  isRosterReviewOpen.value = true;

  try {
    const data = await useApiFetch(`/roster/${event.id}`);

    if (data && data.length > 0) {
      currentRosterData.value = { proposedAssignments: data };
    }
  } catch (error) {
    toast.error(
      "Couldn't load the roster. Check your connection and try again.",
    );
    console.error(error);
  } finally {
    isLoadingRoster.value = false;
  }

  // Smooth scroll
  if (window.innerWidth < 1024) {
    setTimeout(() => window.scrollTo({ top: 150, behavior: "smooth" }), 150);
  }
};

const clearSelection = () => {
  selectedEvent.value = null;
  currentRosterData.value = null;
  isRegistryOpen.value = true;
};

onMounted(() => {
  loadActiveEvents();
});
</script>
