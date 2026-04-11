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
        <div class="lg:col-span-5">
          <AdminForms
            @eventCreated="handleEventCreation"
            @userCreated="handleUserCreation"
          />
        </div>

        <div class="lg:col-span-7 flex flex-col gap-8">
          <section
            class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]"
          >
            <div
              class="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm"
            >
              <h2
                class="text-md font-black font-poppins flex items-center gap-2"
              >
                <Icon
                  name="material-symbols:event-list"
                  class="text-md text-black"
                />
                Event Registry
                <Icon
                  v-if="isLoadingEvents"
                  name="material-symbols:sync"
                  class="animate-spin text-gray-400 ml-2"
                />
              </h2>
              <span
                class="bg-gray-100 text-[0.7rem] font-black font-poppins px-3 py-1 rounded-full uppercase tracking-tighter text-gray-500 border border-gray-200"
              >
                {{ allEvents.length }} Total
              </span>
            </div>

            <div class="overflow-y-auto custom-scrollbar bg-gray-50/30">
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
                  @click="selectedEvent = event"
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
                          ? 'bg-black text-white'
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
                        event.status.replace("_ACTIVE", "").replace("_", " ")
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
          </section>
        </div>
      </div>

      <AdminEventControls
        :event="selectedEvent"
        @statusUpdated="handleStatusUpdate"
        @eventDeleted="handleEventDelete"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
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

const selectedEvent = ref(null);

onMounted(() => {
  initAuth();
  if (!token.value) return router.push("/login");
  loadAllEvents();
});

// Callback from AdminForms
const handleEventCreation = async (eventData, callback) => {
  const newEvent = await createEvent(eventData);
  if (newEvent) selectedEvent.value = newEvent;
  callback(!!newEvent); // Stop the loading spinner in the child
};

// Callback from AdminForms
const handleUserCreation = async (userData, callback) => {
  const success = await createUser(userData);
  callback(success); // Stop the loading spinner in the child
};

// Callback from AdminEventControls
const handleStatusUpdate = async (event, newStatus, callback) => {
  const success = await updateEventStatus(event, newStatus);
  if (success && selectedEvent.value?.id === event.id) {
    selectedEvent.value.status = newStatus;
  }
  callback(); // Stop the loading spinner in the child
};

// Callback from AdminEventControls
const handleEventDelete = async (id, callback) => {
  const success = await deleteEvent(id);
  if (success) selectedEvent.value = null;
  callback(); // Stop the loading spinner in the child
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
</style>
