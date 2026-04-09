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
        <div class="lg:col-span-5 flex flex-col gap-6">
          <section
            class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm transition-all duration-200"
          >
            <h2
              class="text-md font-black font-poppins mb-6 flex items-center gap-2"
            >
              <Icon
                name="material-symbols:add-circle"
                class="text-md text-black"
              />
              Create Event
            </h2>

            <form @submit.prevent="createNewEvent" class="space-y-6">
              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Event Name</label
                >
                <input
                  v-model="newEvent.name"
                  type="text"
                  placeholder="e.g. Annual Symposium 2026"
                  required
                  class="w-full border-gray-600 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Date</label
                >
                <input
                  v-model="newEvent.date"
                  type="date"
                  required
                  class="w-full border-gray-600 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingEvent"
                  class="w-full bg-black text-white font-bold font-poppins py-4 rounded-md shadow-md hover:bg-gray-900 transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon
                    v-if="isCreatingEvent"
                    name="material-symbols:sync"
                    class="animate-spin text-lg"
                  />
                  <Icon
                    v-else
                    name="material-symbols:arrow-forward"
                    class="text-lg"
                  />
                  {{ isCreatingEvent ? "Creating..." : "Initialize Event" }}
                </button>
              </div>
            </form>
          </section>

          <section
            class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm transition-all duration-200"
          >
            <h2
              class="text-md font-black font-poppins mb-6 flex items-center gap-2"
            >
              <Icon
                name="material-symbols:person-add"
                class="text-md text-black"
              />
              Create User
            </h2>

            <form @submit.prevent="createNewUser" class="space-y-6">
              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Username</label
                >
                <input
                  v-model="newUser.username"
                  type="text"
                  placeholder="e.g. usher_john"
                  required
                  class="w-full border-gray-600 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Password</label
                >
                <input
                  v-model="newUser.password"
                  type="password"
                  placeholder="••••••••"
                  required
                  class="w-full border-gray-600 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
                />
              </div>
              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Role</label
                >
                <select
                  v-model="newUser.role"
                  class="w-full border-gray-300 border focus:border-black rounded-md mt-1 py-3 px-4 text-black font-poppins transition-all duration-200 outline-none focus:ring-1 focus:ring-black bg-white"
                >
                  <option value="USHER" class="text-sm">
                    Usher (Scanner Only)
                  </option>
                  <option value="SUPER_ADMIN" class="text-sm">
                    Super Admin (Full Access)
                  </option>
                </select>
              </div>
              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingUser"
                  class="w-full bg-black text-white font-bold font-poppins py-4 rounded-md shadow-md hover:bg-gray-900 transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon
                    v-if="isCreatingUser"
                    name="material-symbols:sync"
                    class="animate-spin text-lg"
                  />
                  <Icon
                    v-else
                    name="material-symbols:person-add"
                    class="text-lg"
                  />
                  {{ isCreatingUser ? "Creating..." : "Register User" }}
                </button>
              </div>
            </form>
          </section>
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

      <div v-if="selectedEvent" class="mt-8 animate-fade-in">
        <section
          class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm relative overflow-hidden"
        >
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10"
          >
            <div>
              <h2 class="text-xl font-black font-poppins text-black">
                {{ selectedEvent.name }}
              </h2>
              <p class="text-sm text-gray-500 font-medium mt-1">
                Current State:
                <span
                  class="text-black font-bold uppercase tracking-wider text-xs bg-gray-100 px-2 py-0.5 rounded ml-1"
                  >{{
                    selectedEvent.status
                      .replace("_ACTIVE", "")
                      .replace("_", " ")
                  }}</span
                >
              </p>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <button
                @click="updateStatus('ARCHIVED')"
                :disabled="
                  selectedEvent.status === 'ARCHIVED' || isUpdatingStatus
                "
                class="bg-gray-100 text-gray-700 border border-gray-200 shadow-sm px-4 py-2.5 rounded-xl font-bold font-poppins text-sm hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Archive Event"
              >
                <Icon name="material-symbols:archive" class="text-lg" />
                <span class="hidden sm:inline">Archive</span>
              </button>
              <button
                @click="deleteEvent(selectedEvent.id)"
                :disabled="isDeletingEvent"
                class="bg-red-50 text-red-600 border border-red-200 shadow-sm px-4 py-2.5 rounded-xl font-bold font-poppins text-sm hover:bg-red-100 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Event"
              >
                <Icon
                  v-if="isDeletingEvent"
                  name="material-symbols:sync"
                  class="text-lg animate-spin"
                />
                <Icon v-else name="material-symbols:delete" class="text-lg" />
                <span class="hidden sm:inline">Delete</span>
              </button>

              <a
                :href="`${config.public.apiBase}/events/${selectedEvent.id}/export`"
                target="_blank"
                class="bg-white border border-gray-200 shadow-sm text-black px-5 py-2.5 rounded-xl font-bold font-poppins text-sm hover:border-black hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              >
                <Icon name="material-symbols:download" class="text-lg" />
                Export CSV
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <button
              @click="updateStatus('SIGN_IN_ACTIVE')"
              :disabled="
                selectedEvent.status === 'SIGN_IN_ACTIVE' || isUpdatingStatus
              "
              class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-green-600 group-hover:bg-green-600 group-hover:text-white group-disabled:text-gray-400"
              >
                <Icon name="material-symbols:login" class="text-xl" />
              </div>
              <span
                class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
                >Sign In</span
              >
              <span
                class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
                >Entrance Mode</span
              >
            </button>

            <button
              @click="updateStatus('SYNCING_PHASE')"
              :disabled="
                selectedEvent.status === 'SYNCING_PHASE' || isUpdatingStatus
              "
              class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-orange-600 group-hover:bg-orange-600 group-hover:text-white group-disabled:text-gray-400"
              >
                <Icon name="material-symbols:sync" class="text-xl" />
              </div>
              <span
                class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
                >Lock & Sync</span
              >
              <span
                class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
                >Cloud Handshake</span
              >
            </button>

            <button
              @click="updateStatus('SIGN_OUT_ACTIVE')"
              :disabled="
                selectedEvent.status === 'SIGN_OUT_ACTIVE' || isUpdatingStatus
              "
              class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-red-600 group-hover:bg-red-600 group-hover:text-white group-disabled:text-gray-400"
              >
                <Icon name="material-symbols:logout" class="text-xl" />
              </div>
              <span
                class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
                >Sign Out</span
              >
              <span
                class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
                >Departure Mode</span
              >
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useRuntimeConfig } from "#app";

const config = useRuntimeConfig(); // <--- Needed to dynamically set the CSV Export Link
const router = useRouter();
const { user, token, initAuth } = useAuth();

const allEvents = ref([]);
const selectedEvent = ref(null);

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0],
});

const newUser = ref({
  username: "",
  password: "",
  role: "USHER",
});

const isLoadingEvents = ref(false);
const isCreatingEvent = ref(false);
const isCreatingUser = ref(false);
const isDeletingEvent = ref(false);
const isUpdatingStatus = ref(false);

onMounted(() => {
  initAuth();
  if (!token.value) return router.push("/login");
  loadAllEvents();
});

const loadAllEvents = async () => {
  isLoadingEvents.value = true;
  try {
    allEvents.value = await useApiFetch("/events");
  } catch (error) {
    console.error("Error fetching events", error);
  } finally {
    isLoadingEvents.value = false;
  }
};

const selectEvent = (event) => {
  selectedEvent.value = event;
};

const createNewEvent = async () => {
  isCreatingEvent.value = true;
  try {
    const data = await useApiFetch("/events", {
      method: "POST",
      body: {
        name: newEvent.value.name,
        date: newEvent.value.date,
        created_by_id: user.value.id,
      },
    });

    alert("Event created successfully!");
    newEvent.value.name = "";
    await loadAllEvents();
    selectEvent(data.event);
  } catch (error) {
    console.error("Error creating event", error);
    alert(error.data?.error || "Failed to create event");
  } finally {
    isCreatingEvent.value = false;
  }
};

const createNewUser = async () => {
  isCreatingUser.value = true;
  try {
    await useApiFetch("/users", {
      method: "POST",
      body: newUser.value,
    });
    alert("User registered successfully!");
    newUser.value = { username: "", password: "", role: "USHER" };
  } catch (error) {
    console.error("Error creating user", error);
    alert(`Failed: ${error.data?.message || "Could not create user"}`);
  } finally {
    isCreatingUser.value = false;
  }
};

const deleteEvent = async (id) => {
  if (
    !confirm(
      "Are you ABSOLUTELY sure you want to delete this event? This action cannot be undone.",
    )
  )
    return;

  isDeletingEvent.value = true;
  try {
    await useApiFetch(`/events/${id}`, { method: "DELETE" });
    alert("Event deleted successfully!");
    selectedEvent.value = null;
    await loadAllEvents();
  } catch (error) {
    console.error("Error deleting event", error);
    alert(error.data?.message || "Failed to delete event.");
  } finally {
    isDeletingEvent.value = false;
  }
};

const updateStatus = async (newStatus) => {
  if (!selectedEvent.value) return;
  if (!confirm(`Change ${selectedEvent.value.name} phase to ${newStatus}?`))
    return;

  isUpdatingStatus.value = true;
  try {
    await useApiFetch(`/events/${selectedEvent.value.id}/status`, {
      method: "PATCH",
      body: { status: newStatus },
    });

    selectedEvent.value.status = newStatus;
    const index = allEvents.value.findIndex(
      (e) => e.id === selectedEvent.value.id,
    );
    if (index !== -1) allEvents.value[index].status = newStatus;
  } catch (error) {
    console.error("Error updating status", error);
    alert(error.data?.error || "Failed to update status");
  } finally {
    isUpdatingStatus.value = false;
  }
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

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
