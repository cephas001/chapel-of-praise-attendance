<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">
    <main class="pt-8 px-4 sm:px-8 max-w-7xl mx-auto">
      <header
        class="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat"
          >
            Admin Control
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            Manage your environment configuration.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="loadAllEvents"
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
        <div class="lg:col-span-7 flex flex-col gap-6 order-1">
          <section
            class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300"
          >
            <button
              @click="isRegistryOpen = !isRegistryOpen"
              class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <div class="flex items-center gap-3">
                <h2
                  class="text-md font-black font-poppins flex items-center gap-2 m-0"
                >
                  <Icon
                    name="material-symbols:event-list"
                    class="text-lg text-black"
                  />
                  Event Registry
                  <Icon
                    v-if="isLoadingEvents"
                    name="material-symbols:sync"
                    class="animate-spin text-gray-400 ml-1"
                  />
                </h2>
                <span
                  class="bg-gray-100 text-[10px] font-bold font-poppins px-2 py-0.5 rounded-md uppercase tracking-widest text-gray-500 border border-gray-200"
                >
                  {{ allEvents.length }} Total
                </span>
              </div>
              <div
                class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
                :class="{ 'rotate-180': isRegistryOpen }"
              >
                <Icon
                  name="material-symbols:keyboard-arrow-down"
                  class="text-xl text-black"
                />
              </div>
            </button>

            <Transition name="accordion">
              <div v-show="isRegistryOpen">
                <div
                  class="border-t border-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50/30"
                >
                  <div
                    v-if="allEvents.length === 0"
                    class="p-8 text-center text-gray-500 font-medium text-sm"
                  >
                    {{
                      isLoadingEvents
                        ? "Loading events..."
                        : "No events have been created yet."
                    }}
                  </div>
                  <div v-else class="divide-y divide-gray-100">
                    <button
                      v-for="event in allEvents"
                      :key="event.id"
                      @click="selectEvent(event)"
                      class="w-full p-5 sm:p-6 flex items-center justify-between group transition-all duration-200 cursor-pointer border-l-4 text-left"
                      :class="
                        selectedEvent?.id === event.id
                          ? 'border-black bg-gray-100/80 shadow-inner'
                          : 'border-transparent bg-white hover:bg-gray-50 hover:border-gray-300'
                      "
                    >
                      <div class="flex items-center gap-4">
                        <div
                          class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-colors"
                          :class="
                            selectedEvent?.id === event.id
                              ? 'bg-black text-white shadow-md'
                              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-black'
                          "
                        >
                          <Icon
                            name="material-symbols:stadium"
                            class="text-xl sm:text-2xl"
                          />
                        </div>
                        <div>
                          <h4
                            class="font-bold font-poppins leading-tight text-sm sm:text-base transition-colors"
                            :class="
                              selectedEvent?.id === event.id
                                ? 'text-black'
                                : 'text-gray-900 group-hover:text-black'
                            "
                          >
                            {{ event.name }}
                          </h4>
                          <p
                            class="text-xs sm:text-sm text-gray-500 font-medium mt-0.5"
                          >
                            {{ new Date(event.date).toLocaleDateString() }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <span
                          class="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold font-poppins uppercase tracking-wider border hidden sm:block"
                          :class="[
                            event.status.includes('ACTIVE')
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : '',
                            event.status === 'SYNCING_PHASE'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : '',
                          ]"
                        >
                          {{
                            event.status
                              .replace("_ACTIVE", "")
                              .replace("_", " ")
                          }}
                        </span>
                        <Icon
                          name="material-symbols:chevron-right"
                          class="text-xl transition-colors"
                          :class="
                            selectedEvent?.id === event.id
                              ? 'text-black'
                              : 'text-gray-300 group-hover:text-black'
                          "
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </section>

          <div v-if="selectedEvent" class="flex flex-col gap-6 animate-fade-in">
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
                  Active Workspace
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
                title="Close Workspace"
              >
                <Icon name="material-symbols:close" class="text-lg" />
              </button>
            </div>

            <AdminAnalytics :eventId="selectedEvent.id" />

            <AdminEventControls
              :event="selectedEvent"
              @statusUpdated="handleStatusUpdate"
              @eventDeleted="handleEventDelete"
            />

            <div v-if="!existingRoster" class="animate-fade-in">
              <AdminRosterSetup
                :eventId="selectedEvent.id"
                @rosterGenerated="handleRosterGenerated"
              />
            </div>

            <section
              v-else
              class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
            >
              <button
                @click="isRosterSetupOpen = !isRosterSetupOpen"
                class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <h2
                    class="text-md font-black font-poppins flex items-center gap-2 m-0"
                  >
                    <Icon
                      name="material-symbols:settings-suggest"
                      class="text-lg text-black"
                    />
                    Modify Roster Parameters
                  </h2>
                </div>
                <div
                  class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
                  :class="{ 'rotate-180': isRosterSetupOpen }"
                >
                  <Icon
                    name="material-symbols:keyboard-arrow-down"
                    class="text-xl text-black"
                  />
                </div>
              </button>

              <Transition name="accordion">
                <div v-show="isRosterSetupOpen">
                  <div class="border-t border-gray-100 pb-2">
                    <AdminRosterSetup
                      :eventId="selectedEvent.id"
                      @rosterGenerated="handleRosterGenerated"
                    />
                  </div>
                </div>
              </Transition>
            </section>

            <section
              v-if="displayRoster"
              class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden animate-fade-in"
            >
              <button
                @click="isRosterReviewOpen = !isRosterReviewOpen"
                class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div class="flex items-center gap-3">
                  <h2
                    class="text-md font-black font-poppins flex items-center gap-2 m-0"
                    :class="generatedProposal ? 'text-black' : 'text-green-700'"
                  >
                    <Icon
                      :name="
                        generatedProposal
                          ? 'material-symbols:warning'
                          : 'material-symbols:fact-check'
                      "
                      class="text-lg"
                    />
                    {{
                      generatedProposal
                        ? "Review Proposed Roster (Unpublished)"
                        : "View Active Roster"
                    }}
                  </h2>
                </div>
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
                  :class="[
                    isRosterReviewOpen ? 'rotate-180' : '',
                    generatedProposal
                      ? 'bg-black/5 text-black'
                      : 'bg-green-50 text-green-700',
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
                      :proposal="displayRoster"
                      :isReadonly="!generatedProposal"
                      @discard="discardProposal"
                      @published="handleRosterPublished"
                    />
                  </div>
                </div>
              </Transition>
            </section>
          </div>
        </div>

        <div class="lg:col-span-5 flex flex-col gap-6 order-2">
          <AdminBroadcast />
          <AdminForms
            @eventCreated="handleEventCreation"
            @userCreated="handleUserCreation"
          />
          <AdminViews />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useAdmin } from "~/composables/useAdmin";

const router = useRouter();
const { token, initAuth } = useAuth();
const {
  allEvents,
  isLoadingEvents,
  loadAllEvents,
  createEvent,
  createUser,
  deleteEvent,
  updateEventStatus,
} = useAdmin();

const isRegistryOpen = ref(true);
const selectedEvent = ref(null);

// Roster States
const existingRoster = ref(null);
const generatedProposal = ref(null);
const isRosterSetupOpen = ref(false);
const isRosterReviewOpen = ref(false);

const displayRoster = computed(
  () => generatedProposal.value || existingRoster.value,
);

// Fetch existing database roster
const loadExistingRoster = async (eventId) => {
  existingRoster.value = null;
  generatedProposal.value = null;
  isRosterSetupOpen.value = false;
  isRosterReviewOpen.value = false;

  try {
    const data = await useApiFetch(`/roster/${eventId}`);
    if (data && data.length > 0) {
      existingRoster.value = {
        warnings: [],
        proposedAssignments: data,
      };
    } else {
      isRosterSetupOpen.value = true;
    }
  } catch (error) {
    console.error("Failed to fetch existing roster", error);
    isRosterSetupOpen.value = true;
  }
};

// --- SELECTION LOGIC ---
const selectEvent = (event) => {
  selectedEvent.value = event;
  isRegistryOpen.value = false;

  loadExistingRoster(event.id);

  if (window.innerWidth < 1024) {
    setTimeout(() => window.scrollTo({ top: 150, behavior: "smooth" }), 150);
  }
};

const clearSelection = () => {
  selectedEvent.value = null;
  generatedProposal.value = null;
  existingRoster.value = null;
  isRegistryOpen.value = true;
};

// --- ROSTER LOGIC ---
const handleRosterGenerated = (proposal) => {
  generatedProposal.value = proposal;
  isRosterReviewOpen.value = true; // Auto-open review when new generated

  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, 100);
};

const discardProposal = () => {
  generatedProposal.value = null;
  if (existingRoster.value) {
    isRosterSetupOpen.value = false; // Hide setup again
    isRosterReviewOpen.value = true; // Show the existing roster again
  }
};

const handleRosterPublished = () => {
  // Move generated draft into existing read-only state
  existingRoster.value = generatedProposal.value;
  generatedProposal.value = null;
  isRosterSetupOpen.value = false;
  isRosterReviewOpen.value = true;
};

// --- LIFECYCLE ---
onMounted(() => {
  initAuth();
  if (!token.value) return router.push("/login");
  loadAllEvents();
});

// --- CALLBACKS ---
const handleEventCreation = async (eventData, callback) => {
  const newEvent = await createEvent(eventData);
  if (newEvent) {
    selectEvent(newEvent);
  }
  callback(!!newEvent);
};

const handleUserCreation = async (userData, callback) => {
  const success = await createUser(userData);
  callback(success);
};

const handleStatusUpdate = async (event, newStatus, callback) => {
  const success = await updateEventStatus(event, newStatus);
  if (success && selectedEvent.value?.id === event.id) {
    selectedEvent.value.status = newStatus;
  }
  callback();
};

const handleEventDelete = async (id, callback) => {
  const success = await deleteEvent(id);
  if (success) {
    clearSelection();
  }
  callback();
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
}

/* Accordion & Fade Animations */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px;
  opacity: 1;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
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
