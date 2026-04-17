<template>
  <div
    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8 animate-fade-in"
  >
    <div
      class="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-green-50"
    >
      <div>
        <h2
          class="text-lg font-black font-poppins flex items-center justify-between gap-2 text-black w-full"
        >
          <div class="flex items-center gap-1">
            <Icon
              :name="
                isReadonly
                  ? 'material-symbols:check-circle'
                  : 'material-symbols:fact-check'
              "
              class="text-xl"
            />
            {{
              isReadonly
                ? "Active Roster Overview"
                : "Roster Proposal Generated"
            }}
          </div>
          <button
            v-if="!isReadonly"
            @click="$emit('discard')"
            class="text-lg font-bold uppercase tracking-widest text-black hover:text-red-800 transition-colors flex items-center"
            title="Discard Proposal"
          >
            <Icon name="material-symbols:delete" />
          </button>
        </h2>

        <p class="text-xs text-black font-medium mt-1">
          {{
            isReadonly
              ? "Current personnel assignments for this event."
              : "Review the algorithm's assignments before publishing to the team."
          }}
        </p>
      </div>
    </div>

    <div
      v-if="proposal.warnings && proposal.warnings.length > 0"
      class="p-4 bg-orange-50 border-b border-orange-100 flex flex-col gap-2"
    >
      <div
        v-for="(warning, index) in proposal.warnings"
        :key="index"
        class="flex items-start gap-2 text-orange-800"
      >
        <Icon name="material-symbols:warning" class="text-lg shrink-0 mt-0.5" />
        <p class="text-sm font-medium font-poppins leading-tight">
          {{ warning }}
        </p>
      </div>
    </div>

    <div class="px-6 pt-6 sm:px-8 sm:pt-8 flex flex-col sm:flex-row gap-4 mb-4">
      <div class="relative flex-grow">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <Icon name="material-symbols:search" class="text-gray-400 text-lg" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search personnel or unit..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-poppins focus:border-black outline-none transition-colors"
        />
      </div>
      <select
        v-model="sortOrder"
        class="border border-gray-300 rounded-lg px-4 py-2 text-sm font-poppins bg-white focus:border-black outline-none cursor-pointer min-w-[150px]"
      >
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="unit">Unit Grouping</option>
      </select>
    </div>

    <div class="px-6 pb-6 sm:px-8 sm:pb-8 overflow-x-auto">
      <table
        class="w-full text-left border-collapse whitespace-nowrap border border-gray-200 rounded-xl"
      >
        <thead>
          <tr
            class="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest font-bold text-gray-500 font-poppins"
          >
            <th class="p-4 rounded-tl-xl">Personnel</th>
            <th class="p-4">Primary Duty</th>
            <th class="p-4">Secondary Duty (Rest)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="user in paginatedAndFilteredAssignments"
            :key="user.id"
            class="hover:bg-gray-50/50 transition-colors"
          >
            <td class="p-4">
              <span class="font-bold text-sm font-poppins text-black block">{{
                user.username
              }}</span>
              <span
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                >{{ user.unit }}</span
              >
            </td>
            <td class="p-4">
              <div class="flex flex-col gap-1 items-start">
                <span
                  v-for="task in user.primaryTasks"
                  :key="task.zone_name"
                  class="px-2 py-1 rounded text-xs font-bold font-montserrat border"
                  :class="
                    task.task_type === 'ARRANGER'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  "
                >
                  {{ task.zone_name }}
                  <span
                    class="uppercase tracking-widest text-[9px] ml-1 opacity-70"
                    >{{
                      task.task_type === "ARRANGER" ? "Arrange" : "Scan"
                    }}</span
                  >
                </span>
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-col gap-1 items-start">
                <span
                  v-for="task in user.secondaryTasks"
                  :key="task.zone_name"
                  class="px-2 py-1 rounded text-xs font-bold font-montserrat bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {{ task.zone_name }}
                  <span
                    class="uppercase tracking-widest text-[9px] ml-1 opacity-70"
                    >{{
                      task.task_type === "ARRANGER" ? "Arrange" : "Scan"
                    }}</span
                  >
                </span>
                <span
                  v-if="user.secondaryTasks.length === 0"
                  class="text-xs text-gray-400 italic"
                  >None</span
                >
              </div>
            </td>
          </tr>
          <tr v-if="paginatedAndFilteredAssignments.length === 0">
            <td
              colspan="3"
              class="p-8 text-center text-xs text-gray-500 font-medium"
            >
              No personnel found matching your search.
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="totalPages > 1"
        class="mt-4 flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200"
      >
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
        >
          <Icon
            name="material-symbols:chevron-left"
            class="text-lg text-black"
          />
        </button>
        <span
          class="text-[11px] font-bold uppercase tracking-widest text-gray-500 font-poppins"
        >
          Page <span class="text-black">{{ currentPage }}</span> of
          <span class="text-black">{{ totalPages }}</span>
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
        >
          <Icon
            name="material-symbols:chevron-right"
            class="text-lg text-black"
          />
        </button>
      </div>
    </div>

    <div
      class="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center"
    >
      <p class="text-xs text-gray-500 font-poppins">
        Team members: <strong>{{ groupedAssignments.length }}</strong>
      </p>

      <button
        v-if="!isReadonly"
        @click="publishRoster"
        :disabled="isPublishing"
        class="bg-green-600 text-white px-8 py-3 rounded-xl font-bold font-poppins uppercase tracking-widest text-xs hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Icon
          v-if="isPublishing"
          name="material-symbols:sync"
          class="text-lg animate-spin"
        />
        <Icon v-else name="material-symbols:publish" class="text-lg" />
        {{ isPublishing ? "Publishing..." : "Publish " }}
      </button>

      <span
        v-else
        class="text-xs font-bold text-green-700 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-lg border border-green-200 shadow-sm"
      >
        <Icon name="material-symbols:check-circle" class="text-lg" />
        Published
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useToast } from "~/composables/useToast";

const props = defineProps({
  eventId: String,
  proposal: Object, // The entire payload emitted from the Setup component
  isReadonly: { type: Boolean, default: false }, // If true, hides the Publish button and disables interactions
});

const emit = defineEmits(["published", "discard"]);
const toast = useToast();
const isPublishing = ref(false);

// State for filtering and pagination
const searchQuery = ref("");
const sortOrder = ref("name_asc");
const currentPage = ref(1);
const itemsPerPage = 20;

// Reset pagination when search query changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Group the flat array of assignments by User so it looks clean in the table
const groupedAssignments = computed(() => {
  if (!props.proposal || !props.proposal.proposedAssignments) return [];

  const userMap = {};

  props.proposal.proposedAssignments.forEach((assignment) => {
    // Added a small failsafe here in case the DB fetch returns without nested user object temporarily
    const userId = assignment.user_id;
    const userData = assignment.user || {
      username: "Unknown",
      unit: "Unknown",
    };

    if (!userMap[userId]) {
      userMap[userId] = {
        id: userId,
        username: userData.username,
        unit: userData.unit,
        primaryTasks: [],
        secondaryTasks: [],
      };
    }

    // Clean up the object to pass to the UI
    const taskObj = {
      zone_name: assignment.zone_name,
      task_type: assignment.task_type,
    };

    if (assignment.is_primary) {
      userMap[userId].primaryTasks.push(taskObj);
    } else {
      userMap[userId].secondaryTasks.push(taskObj);
    }
  });

  return Object.values(userMap);
});

// NEW: Compute the filtered, sorted, and paginated list
const paginatedAndFilteredAssignments = computed(() => {
  let result = [...groupedAssignments.value];

  // 1. Filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.unit.toLowerCase().includes(query),
    );
  }

  // 2. Sort
  result.sort((a, b) => {
    if (sortOrder.value === "name_asc") {
      return a.username.localeCompare(b.username);
    } else if (sortOrder.value === "name_desc") {
      return b.username.localeCompare(a.username);
    } else if (sortOrder.value === "unit") {
      // Sort by unit first, then by name within the unit
      const unitCompare = a.unit.localeCompare(b.unit);
      if (unitCompare !== 0) return unitCompare;
      return a.username.localeCompare(b.username);
    }
    return 0;
  });

  // 3. Paginate
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return result.slice(start, end);
});

const totalPages = computed(() => {
  let result = [...groupedAssignments.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.unit.toLowerCase().includes(query),
    );
  }
  return Math.ceil(result.length / itemsPerPage) || 1;
});

const publishRoster = async () => {
  isPublishing.value = true;
  try {
    await useApiFetch(`/roster/${props.eventId}/publish`, {
      method: "POST",
      body: { assignments: props.proposal.proposedAssignments },
    });

    toast.success("Roster successfully published to the database!");
    emit("published"); // Tell parent to clear the view
  } catch (error) {
    toast.error("Failed to publish roster.");
    console.error(error);
  } finally {
    isPublishing.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
