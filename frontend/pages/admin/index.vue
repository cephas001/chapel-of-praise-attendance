<template>
  <div class="min-h-screen bg-canvas pb-12 font-sans text-ink">
    <main class="mx-auto max-w-6xl px-5 pt-6 sm:px-8">
      <LedgerPageHeader eyebrow="control room" title="Admin control">
        <template #actions>
          <button
            type="button"
            @click="loadAllEvents"
            :disabled="isLoadingEvents"
            class="led-eyebrow inline-flex min-h-11 items-center gap-1.5 py-2 transition-colors hover:text-ink disabled:opacity-50"
            aria-label="Refresh admin data"
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

      <div class="relative mt-6">
        <nav
          ref="tabRail"
          aria-label="Admin sections"
          class="overflow-x-auto"
          @scroll="updateTabRailFade"
        >
          <div class="flex w-max min-w-full gap-6 border-b border-rule">
            <button
              v-for="tab in adminTabs"
              :key="tab.id"
              type="button"
              class="flex items-baseline gap-2 whitespace-nowrap border-b-2 pb-3 text-[13px] font-medium transition-colors"
              :class="
                activeTab === tab.id
                  ? 'border-chapel text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              "
              :aria-current="activeTab === tab.id ? 'page' : undefined"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </nav>
        <div
          v-show="tabFadeVisible"
          aria-hidden="true"
          class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-canvas via-canvas/80 to-transparent lg:hidden"
        ></div>
      </div>

      <section
        v-show="activeTab === 'workspace'"
        class="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-12 lg:gap-0"
      >
        <div class="lg:col-span-4 lg:pr-8">
          <LedgerEventRegister
            v-model:isOpen="isRegistryOpen"
            :events="allEvents"
            :selectedId="selectedEvent?.id"
            :isLoading="isLoadingEvents"
            showStatus
            emptyMessage="No events have been created yet."
            @select="(event) => selectEvent(event)"
          />
        </div>

        <div class="lg:col-span-8 lg:border-l lg:border-rule lg:pl-8">
          <div v-if="!selectedEvent" class="lg:min-h-[22rem]">
            <p class="led-eyebrow">no event selected</p>
            <h2 class="led-display mt-2 max-w-sm text-[28px] sm:text-[32px]">
              Select an event to open its controls.
            </h2>
            <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              From here you manage everything relating to an event.
            </p>
          </div>

          <div v-else class="flex flex-col gap-8">
            <LedgerPhaseBar
              :name="selectedEvent.name"
              :context="
                getEventStatus(selectedEvent.status).label.toLowerCase()
              "
              :dotClass="getEventStatus(selectedEvent.status).dotClass"
              @close="clearSelection"
            />

            <AdminEventControls
              :event="selectedEvent"
              @statusUpdated="handleStatusUpdate"
              @eventDeleted="handleEventDelete"
            />

            <div v-if="!existingRoster">
              <AdminRosterSetup
                :eventId="selectedEvent.id"
                @rosterGenerated="handleRosterGenerated"
              />
            </div>

            <section v-else class="border-t border-rule">
              <button
                @click="isRosterSetupOpen = !isRosterSetupOpen"
                class="flex w-full items-center justify-between gap-4 py-4 text-left"
                :aria-expanded="isRosterSetupOpen"
              >
                <span class="led-eyebrow">roster parameters</span>
                <span class="led-eyebrow shrink-0 text-chapel">{{
                  isRosterSetupOpen ? "hide" : "modify"
                }}</span>
              </button>

              <div v-if="isRosterSetupOpen" class="pb-2">
                <AdminRosterSetup
                  :eventId="selectedEvent.id"
                  @rosterGenerated="handleRosterGenerated"
                />
              </div>
            </section>

            <section
              v-if="displayRoster"
              class="border-t border-rule-strong pt-4"
            >
              <button
                @click="isRosterReviewOpen = !isRosterReviewOpen"
                class="flex w-full items-center justify-between gap-4 py-4 text-left"
                :aria-expanded="isRosterReviewOpen"
              >
                <span class="led-eyebrow">
                  {{
                    generatedProposal
                      ? "proposed roster, unpublished"
                      : "active roster"
                  }}
                </span>
                <span class="led-eyebrow shrink-0 text-chapel">{{
                  isRosterReviewOpen ? "hide" : "open"
                }}</span>
              </button>

              <div v-if="isRosterReviewOpen">
                <AdminRosterReview
                  :eventId="selectedEvent.id"
                  :proposal="displayRoster"
                  :isReadonly="!generatedProposal"
                  @discard="discardProposal"
                  @published="handleRosterPublished"
                />
              </div>
            </section>
          </div>
        </div>
      </section>

      <section v-show="activeTab === 'broadcast'" class="max-w-3xl pt-8">
        <AdminBroadcast default-open />
      </section>

      <section v-show="activeTab === 'create-event'" class="max-w-2xl pt-8">
        <AdminForms
          section="event"
          default-open
          @eventCreated="handleEventCreation"
          @userCreated="handleUserCreation"
        />
      </section>

      <section v-show="activeTab === 'create-user'" class="max-w-2xl pt-8">
        <AdminForms
          section="user"
          default-open
          @eventCreated="handleEventCreation"
          @userCreated="handleUserCreation"
        />
      </section>

      <section v-show="activeTab === 'directory'" class="pt-8">
        <AdminUserView default-open />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useAdmin } from "~/composables/useAdmin";
import { getEventStatus } from "~/composables/useStatus";

const router = useRouter();
const { token } = useAuth();
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
const activeTab = ref("workspace");
const tabRail = ref(null);
const tabFadeVisible = ref(true);

const adminTabs = [
  {
    id: "workspace",
    label: "Event workspace",
    icon: "material-symbols:dashboard",
  },
  { id: "broadcast", label: "Broadcast", icon: "material-symbols:campaign" },
  {
    id: "create-event",
    label: "Create event",
    icon: "material-symbols:event-upcoming",
  },
  { id: "create-user", label: "Add user", icon: "material-symbols:person-add" },
  { id: "directory", label: "User directory", icon: "material-symbols:group" },
];

const scrollActiveTabIntoView = () => {
  const rail = tabRail.value;
  const active = rail?.querySelector('[aria-current="page"]');
  if (!rail || !active) return;

  const target =
    active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2;
  rail.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
};

const updateTabRailFade = () => {
  const rail = tabRail.value;
  if (!rail) return;
  tabFadeVisible.value =
    rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2;
};

watch(activeTab, () => nextTick(scrollActiveTabIntoView));

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
  if (!token.value) return router.push("/login");
  loadAllEvents();
});

// --- CALLBACKS ---
const handleEventCreation = async (eventData, callback) => {
  const newEvent = await createEvent(eventData);
  if (newEvent) {
    activeTab.value = "workspace";
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
