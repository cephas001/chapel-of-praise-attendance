<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
    <main class="pt-8 px-6 sm:px-8 max-w-7xl mx-auto">
      <header
        class="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat"
          >
            Active Rosters
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            View live personnel assignments.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="loadActiveEvents"
            :disabled="isLoadingEvents"
            class="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Refresh Data"
          >
            <Icon
              name="material-symbols:refresh"
              class="text-xl text-gray-700"
              :class="{ 'animate-spin': isLoadingEvents }"
            />
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-5 flex flex-col gap-6 order-1">
          <EventSelector
            :events="activeEvents"
            :selectedId="selectedEvent?.id"
            :isLoading="isLoadingEvents"
            v-model:isOpen="isRegistryOpen"
            @select="selectEvent"
          />
        </div>

        <div class="lg:col-span-7 flex flex-col gap-6 order-2">
          <div
            v-if="!selectedEvent"
            class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-70"
          >
            <div
              class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 text-gray-400"
            >
              <Icon
                name="material-symbols:format-list-bulleted"
                class="text-3xl"
              />
            </div>
            <h2 class="text-xl font-black text-black font-montserrat mb-2">
              Awaiting Event Selection
            </h2>
            <p class="text-sm text-gray-500 max-w-xs">
              Select an active event from the registry to view its live
              personnel roster.
            </p>
          </div>

          <div v-else class="flex flex-col gap-6 animate-fade-in">
            <div
              class="bg-black text-white p-6 sm:p-8 rounded-2xl flex justify-between items-center shadow-lg border border-gray-800"
            >
              <div>
                <p
                  class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"
                >
                  <span
                    class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                  ></span>
                  Live Database
                </p>
                <h3
                  class="text-xl sm:text-2xl font-black font-poppins tracking-tight"
                >
                  {{ selectedEvent.name }}
                </h3>
              </div>
              <button
                @click="clearSelection"
                class="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors border border-gray-700"
                title="Close Roster"
              >
                <Icon name="material-symbols:close" class="text-lg" />
              </button>
            </div>

            <div
              v-if="isLoadingRoster"
              class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center"
            >
              <Icon
                name="material-symbols:sync"
                class="animate-spin text-4xl text-gray-300 mb-4"
              />
              <p
                class="text-sm text-gray-500 font-bold uppercase tracking-widest"
              >
                Fetching Roster...
              </p>
            </div>

            <div
              v-else-if="
                !currentRosterData ||
                currentRosterData.proposedAssignments.length === 0
              "
              class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center"
            >
              <div
                class="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-400"
              >
                <Icon
                  name="material-symbols:pending-actions"
                  class="text-3xl"
                />
              </div>
              <h2 class="text-xl font-black text-black font-montserrat mb-2">
                No Roster Published
              </h2>
              <p class="text-sm text-gray-500 max-w-xs">
                A roster has not yet been generated and published for this
                event.
              </p>
            </div>

            <section
              v-else
              class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
            >
              <button
                @click="isRosterReviewOpen = !isRosterReviewOpen"
                class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <h2
                    class="text-md font-black font-poppins flex items-center gap-2 m-0 text-green-700"
                  >
                    <Icon name="material-symbols:fact-check" class="text-lg" />
                    View Active Roster
                  </h2>
                </div>
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
                  :class="[
                    isRosterReviewOpen ? 'rotate-180' : '',
                    'bg-green-50 text-green-700',
                  ]"
                >
                  <Icon
                    name="material-symbols:keyboard-arrow-down"
                    class="text-xl"
                  />
                </div>
              </button>

              <Transition name="accordion">
                <div v-show="isRosterReviewOpen">
                  <div class="border-t border-gray-100">
                    <AdminRosterReview
                      :eventId="selectedEvent.id"
                      :proposal="currentRosterData"
                      :isReadonly="true"
                    />
                  </div>
                </div>
              </Transition>
            </section>
          </div>
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
    toast.error("Failed to load active events.");
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
    toast.error("Failed to load roster data.");
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

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
