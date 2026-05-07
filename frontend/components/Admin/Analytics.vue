<template>
  <div class="flex flex-col gap-6" v-if="eventId">
    <section
      class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
    >
      <button
        @click="toggleAccordion"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <div class="flex items-center gap-3">
          <h2
            class="text-md font-black font-poppins flex items-center gap-2 m-0 text-black"
          >
            <Icon name="material-symbols:monitoring" class="text-lg" />
            Live Analytics
          </h2>
          <span
            v-if="isAnalyticsOpen"
            class="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold uppercase tracking-widest border border-green-200"
          >
            <span
              class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
            ></span>
            Live
          </span>
        </div>
        <div
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isAnalyticsOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-black"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-show="isAnalyticsOpen">
          <div
            class="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-gray-100 mt-2 animate-fade-in"
          >
            <div
              v-if="isLoading && !stats"
              class="py-12 flex justify-center items-center"
            >
              <Icon
                name="material-symbols:sync"
                class="animate-spin text-3xl text-gray-300"
              />
            </div>

            <div v-else-if="stats" class="pt-6 space-y-8">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  class="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
                >
                  <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins mb-2"
                    >Total Entries</span
                  >
                  <span
                    class="text-3xl font-black text-black font-montserrat"
                    >{{ stats.totalSignIns }}</span
                  >
                </div>
                <div
                  class="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
                >
                  <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins mb-2"
                    >Total Departures</span
                  >
                  <span
                    class="text-3xl font-black text-black font-montserrat"
                    >{{ stats.totalSignOuts }}</span
                  >
                </div>
                <div
                  class="p-5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins mb-2 relative z-10"
                    >Throughput</span
                  >
                  <div class="flex items-end gap-2 relative z-10">
                    <span
                      class="text-3xl font-black text-black font-montserrat"
                      >{{ stats.throughput }}</span
                    >
                    <span
                      class="text-xs font-bold text-gray-400 pb-1.5 font-poppins"
                      >scans/min</span
                    >
                  </div>
                </div>
                <div
                  class="p-5 bg-gray-900 rounded-xl border border-gray-800 flex flex-col justify-between text-white"
                >
                  <span
                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-poppins mb-2"
                    >Active Ushers</span
                  >
                  <div class="flex items-end gap-2">
                    <span class="text-3xl font-black font-montserrat">{{
                      stats.activeUshers
                    }}</span>
                    <span
                      class="text-xs font-bold text-gray-500 pb-1.5 font-poppins"
                      >/ {{ stats.roster.length }}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div
                  class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4"
                >
                  <h3
                    class="text-xs font-bold uppercase tracking-widest font-montserrat text-black shrink-0"
                  >
                    Deployment Roster
                  </h3>

                  <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div class="relative w-full sm:w-64">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <Icon
                          name="material-symbols:search"
                          class="text-gray-400 text-sm"
                        />
                      </div>
                      <input
                        v-model="rosterSearch"
                        type="text"
                        placeholder="Search ushers..."
                        class="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-poppins focus:border-black outline-none transition-colors"
                      />
                    </div>
                    <select
                      v-model="rosterSort"
                      class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-poppins focus:border-black outline-none cursor-pointer w-full sm:w-auto"
                    >
                      <option value="scans_desc">Highest Scans</option>
                      <option value="scans_asc">Lowest Scans</option>
                      <option value="status">Online First</option>
                      <option value="name_asc">A-Z (Username)</option>
                    </select>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-xl overflow-x-auto">
                  <table
                    class="w-full text-left border-collapse bg-white whitespace-nowrap"
                  >
                    <thead>
                      <tr
                        class="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-widest font-bold text-gray-400 font-poppins"
                      >
                        <th class="p-3 pl-5">Usher</th>
                        <th class="p-3">Status</th>
                        <th class="p-3 text-right">Sign Ins</th>
                        <th class="p-3 text-right">Sign Outs</th>
                        <th class="p-3 pr-5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr
                        v-for="usher in paginatedRoster"
                        :key="usher.id"
                        class="hover:bg-gray-50/50 transition-colors"
                      >
                        <td class="p-3 pl-5 w-1/3">
                          <span
                            class="font-bold text-sm font-poppins text-black"
                            >{{
                              usher.first_name + " " + usher.last_name
                            }}</span
                          >
                        </td>
                        <td class="p-3 w-1/4">
                          <span
                            class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5"
                            :class="
                              usher.isOnline
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                            "
                          >
                            <span
                              class="w-1.5 h-1.5 rounded-full"
                              :class="
                                usher.isOnline
                                  ? 'bg-green-500 animate-pulse'
                                  : 'bg-gray-400'
                              "
                            ></span>
                            {{ usher.isOnline ? "Online" : "Offline" }}
                          </span>
                        </td>
                        <td
                          class="p-3 text-right font-montserrat font-bold text-black"
                        >
                          {{ usher.signIns }}
                        </td>
                        <td
                          class="p-3 text-right font-montserrat font-bold text-black"
                        >
                          {{ usher.signOuts }}
                        </td>
                        <td class="p-3 pr-5 text-right">
                          <span
                            class="text-sm font-black font-montserrat text-black bg-gray-100 px-3 py-1 rounded-md border border-gray-200 shadow-sm"
                          >
                            {{ usher.totalScans }}
                          </span>
                        </td>
                      </tr>
                      <tr v-if="paginatedRoster.length === 0">
                        <td
                          colspan="5"
                          class="p-8 text-center text-xs text-gray-500 font-medium"
                        >
                          No ushers match your search.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div
                  v-if="totalPages > 1"
                  class="mt-4 flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200"
                >
                  <button
                    @click="rosterPage--"
                    :disabled="rosterPage <= 1"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <Icon
                      name="material-symbols:chevron-left"
                      class="text-lg text-black"
                    />
                  </button>
                  <span
                    class="text-[11px] font-bold uppercase tracking-widest text-gray-500 font-poppins"
                  >
                    Page <span class="text-black">{{ rosterPage }}</span> of
                    <span class="text-black">{{ totalPages }}</span>
                  </span>
                  <button
                    @click="rosterPage++"
                    :disabled="rosterPage >= totalPages"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <Icon
                      name="material-symbols:chevron-right"
                      class="text-lg text-black"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from "vue";

const props = defineProps({
  eventId: String,
});

const isAnalyticsOpen = ref(false);
const isLoading = ref(false);
const stats = ref(null);
let pollingInterval = null;

// Table State
const rosterSearch = ref("");
const rosterSort = ref("scans_desc");
const rosterPage = ref(1);
const itemsPerPage = 15; // Displays 15 items per page as requested

// Reset to page 1 automatically when search or sort criteria changes
watch([rosterSearch, rosterSort], () => {
  rosterPage.value = 1;
});

// 1. Process the live data (Filter & Sort)
const processedRoster = computed(() => {
  if (!stats.value || !stats.value.roster) return [];

  let result = [...stats.value.roster];

  // Apply Search
  if (rosterSearch.value) {
    const query = rosterSearch.value.toLowerCase();
    result = result.filter((u) => u.username.toLowerCase().includes(query));
  }

  // Apply Sort (CHANGED .scans to .totalScans)
  result.sort((a, b) => {
    if (rosterSort.value === "scans_desc") return b.totalScans - a.totalScans;
    if (rosterSort.value === "scans_asc") return a.totalScans - b.totalScans;
    if (rosterSort.value === "name_asc")
      return a.username.localeCompare(b.username);
    if (rosterSort.value === "status")
      return b.isOnline === a.isOnline ? 0 : b.isOnline ? 1 : -1;
    return 0;
  });

  return result;
});

// 2. Paginate the processed data
const paginatedRoster = computed(() => {
  const start = (rosterPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return processedRoster.value.slice(start, end);
});

// Calculate total pages for UI controls
const totalPages = computed(() => {
  return Math.ceil(processedRoster.value.length / itemsPerPage) || 1;
});

const fetchStats = async () => {
  if (!props.eventId) return;
  isLoading.value = true;
  try {
    const data = await useApiFetch(`/events/${props.eventId}/live-stats`);
    stats.value = data;
  } catch (error) {
    console.error("Failed to fetch live stats", error);
  } finally {
    isLoading.value = false;
  }
};

const startPolling = () => {
  if (pollingInterval) clearInterval(pollingInterval);
  fetchStats();
  pollingInterval = setInterval(fetchStats, 10000);
};

const stopPolling = () => {
  if (pollingInterval) clearInterval(pollingInterval);
};

const toggleAccordion = () => {
  isAnalyticsOpen.value = !isAnalyticsOpen.value;
  if (isAnalyticsOpen.value) {
    startPolling();
  } else {
    stopPolling();
  }
};

watch(
  () => props.eventId,
  (newId) => {
    stats.value = null;
    rosterPage.value = 1; // Reset to page 1 when viewing a new event
    rosterSearch.value = "";
    if (isAnalyticsOpen.value && newId) {
      startPolling();
    } else {
      stopPolling();
    }
  },
);

onUnmounted(stopPolling);
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 1200px;
  opacity: 1;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
