<template>
  <div class="max-w-3xl mx-auto p-6 flex flex-col items-center">
    <header
      class="w-full py-4 mb-8 border-b border-gray-200 flex justify-between items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-blue-900">Admin Command Center</h1>
        <p class="text-gray-500 text-sm">Manage Events & Reports</p>
      </div>
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/"
          class="text-blue-600 text-sm font-bold hover:underline"
        >
          &larr; Back to Scanner
        </NuxtLink>
        <button
          @click="handleLogout"
          class="text-red-600 text-sm font-bold hover:underline"
        >
          Logout
        </button>
      </div>
    </header>

    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 class="text-lg font-bold text-gray-800 mb-4">Create New Event</h2>
        <form @submit.prevent="createNewEvent" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1"
              >Event Name</label
            >
            <input
              v-model="newEvent.name"
              type="text"
              placeholder="e.g. Sunday Service"
              class="w-full border border-gray-300 rounded p-2 text-sm"
              required
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1"
              >Date</label
            >
            <input
              v-model="newEvent.date"
              type="date"
              class="w-full border border-gray-300 rounded p-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
          >
            Create Event
          </button>
        </form>
      </div>

      <div
        class="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col"
      >
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          Select Event to Manage
        </h2>
        <div
          class="flex-1 overflow-y-auto max-h-[200px] border border-gray-200 rounded p-2"
        >
          <div
            v-if="allEvents.length === 0"
            class="text-sm text-gray-500 text-center py-4"
          >
            No events found.
          </div>
          <button
            v-for="event in allEvents"
            :key="event.id"
            @click="selectEvent(event)"
            class="w-full text-left p-3 mb-2 rounded border transition-all hover:bg-blue-50"
            :class="
              selectedEvent?.id === event.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-100'
            "
          >
            <div class="font-bold text-sm text-gray-800">{{ event.name }}</div>
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">{{
                new Date(event.date).toLocaleDateString()
              }}</span>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                :class="
                  event.status.includes('ACTIVE')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ event.status.replace("_ACTIVE", "").replace("_", " ") }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedEvent" class="w-full">
      <div
        class="w-full bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-200"
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-bold text-gray-800">
            Phase Control:
            <span class="text-blue-600">{{ selectedEvent.name }}</span>
          </h2>
          <span
            class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold tracking-widest border border-blue-200"
          >
            {{ selectedEvent.status.replace("_ACTIVE", "").replace("_", " ") }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            @click="updateStatus('SIGN_IN_ACTIVE')"
            :disabled="selectedEvent.status === 'SIGN_IN_ACTIVE'"
            class="py-3 px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-100 text-green-800 hover:bg-green-200"
          >
            1. Start Sign In
          </button>
          <button
            @click="updateStatus('SYNCING_PHASE')"
            :disabled="selectedEvent.status === 'SYNCING_PHASE'"
            class="py-3 px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            2. Lock & Sync
          </button>
          <button
            @click="updateStatus('SIGN_OUT_ACTIVE')"
            :disabled="selectedEvent.status === 'SIGN_OUT_ACTIVE'"
            class="py-3 px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-100 text-red-800 hover:bg-red-200"
          >
            3. Start Sign Out
          </button>
        </div>
      </div>

      <div
        class="w-full bg-white rounded-xl shadow-md p-6 border border-gray-100 flex justify-between items-center"
      >
        <div>
          <h2 class="text-lg font-bold text-gray-800">Attendance Report</h2>
          <p class="text-sm text-gray-500">
            Download the final records for {{ selectedEvent.name }}.
          </p>
        </div>
        <a
          :href="`http://localhost:5000/api/events/${selectedEvent.id}/export`"
          target="_blank"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
        >
          Download CSV
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

const router = useRouter();
const { user, token, initAuth, logout } = useAuth();

const allEvents = ref([]);
const selectedEvent = ref(null);

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0], // Sets today's date as default
});

// Kick user out if not logged in
onMounted(() => {
  initAuth();
  if (!token.value) {
    return router.push("/login");
  }
  loadAllEvents();
});

const handleLogout = () => {
  logout();
  router.push("/login");
};

// Fetch all events for the list
const loadAllEvents = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/events");
    if (res.ok) allEvents.value = await res.json();
  } catch (error) {
    console.error("Error fetching events", error);
  }
};

// Select an event to manage
const selectEvent = (event) => {
  selectedEvent.value = event;
};

// Create a new event
const createNewEvent = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newEvent.value.name,
        date: newEvent.value.date,
        created_by_id: user.value.id, // Dynamic Admin ID!
      }),
    });

    if (res.ok) {
      const data = await res.json();
      alert("Event created successfully!");
      newEvent.value.name = ""; // Reset form
      await loadAllEvents(); // Refresh list
      selectEvent(data.event); // Automatically select the new event
    }
  } catch (error) {
    console.error("Error creating event", error);
  }
};

// Update the phase of the currently selected event
const updateStatus = async (newStatus) => {
  if (!selectedEvent.value) return;
  if (!confirm(`Change ${selectedEvent.value.name} phase to ${newStatus}?`))
    return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/events/${selectedEvent.value.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    if (res.ok) {
      // Update the local state so the UI reflects the change instantly
      selectedEvent.value.status = newStatus;

      // Update the item in the array list too
      const index = allEvents.value.findIndex(
        (e) => e.id === selectedEvent.value.id,
      );
      if (index !== -1) allEvents.value[index].status = newStatus;
    }
  } catch (error) {
    console.error("Error updating status", error);
  }
};
</script>
