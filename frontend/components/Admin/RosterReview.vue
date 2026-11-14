<template>
  <div class="bg-white rounded-none border border-rule overflow-hidden">
    <!-- <div
      class="p-6 sm:p-8 border-b border-rule flex justify-between items-center"
      :class="isReadonly ? 'status-live' : 'status-draft'"
    >
      <div>
        <h2
          class="text-lg font-semibold font-sans flex items-center justify-between gap-2 text-ink w-full"
        >
          <div class="flex items-center gap-2">
            {{
              isReadonly ? "Active event roster" : "Roster proposal generated"
            }}
          </div>
          <button
            v-if="!isReadonly"
            type="button"
            @click="$emit('discard')"
            class="text-lg font-bold text-ink hover:text-status-error transition-colors flex items-center"
            title="Discard Proposal"
            aria-label="Discard roster proposal"
          >
            <Icon name="material-symbols:delete" />
          </button>
        </h2>

        <p class="text-xs text-ink font-medium mt-1">
          {{
            isReadonly
              ? "Current assignments for this event."
              : "Review the proposed assignments before publishing."
          }}
        </p>
      </div>
    </div> -->

    <div
      v-if="proposal.warnings && proposal.warnings.length > 0 && !isReadonly"
      class="status-syncing p-4 border-b flex flex-col gap-2"
    >
      <div
        v-for="(warning, index) in proposal.warnings"
        :key="index"
        class="flex items-start gap-2 text-status-syncing"
      >
        <Icon name="material-symbols:warning" class="text-lg shrink-0 mt-0.5" />
        <p class="text-sm font-medium font-sans leading-tight">
          {{ warning }}
        </p>
      </div>
    </div>

    <div class="px-6 pt-6 sm:px-8 sm:pt-8 flex flex-col sm:flex-row gap-4 mb-4">
      <div class="relative flex-grow">
        <div
          class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"
        >
          <Icon name="material-symbols:search" class="text-muted text-lg" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search personnel, unit, or zone..."
          class="w-full pl-8 pr-4 py-2 border border-rule-strong text-xs font-sans transition-colors focus-visible:border-chapel"
        />
      </div>
      <select
        v-model="sortOrder"
        class="border border-rule-strong px-2 py-2 text-xs font-sans bg-white focus-visible:border-chapel cursor-pointer min-w-37.5"
      >
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="unit">Unit Grouping</option>
        <option value="zone">Zone Progression</option>
      </select>
    </div>

    <div class="cv-auto px-6 pb-6 sm:px-8 sm:pb-8 overflow-x-auto">
      <table
        class="w-full text-left border-collapse whitespace-nowrap border border-rule rounded-none"
      >
        <thead>
          <tr class="border-b border-rule text-xs text-muted font-sans">
            <th class="p-4 rounded-tl-xl">Personnel</th>
            <th class="p-4">Primary Duty</th>
            <th class="p-4">Secondary Duty</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-rule">
          <tr
            v-for="user in paginatedAndFilteredAssignments"
            :key="user.id"
            class="hover:bg-inset/50 transition-colors"
          >
            <td class="p-4">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="w-8 h-8 rounded-[2px] border border-rule bg-inset flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-colors"
                  :aria-label="`View ${user.username}'s profile picture`"
                  @click="openAvatarViewer(user)"
                >
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    loading="lazy"
                    alt="Avatar"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-semibold text-muted">
                    {{
                      user.first_name?.charAt(0) ||
                      user.username?.charAt(0) ||
                      "U"
                    }}
                  </span>
                </button>
                <div>
                  <span class="font-semibold text-xs font-sans text-ink block">
                    {{ user.username }}
                  </span>

                  <span
                    class="text-xs font-medium text-muted block mt-0.5 capitalize"
                  >
                    {{ (user.unit || "").replace(/_/g, " ").toLowerCase() }}
                  </span>
                </div>
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-col gap-1 items-start">
                <span
                  v-for="task in user.primaryTasks"
                  :key="task.zone_name"
                  class="px-2 py-1 rounded-[2px] text-[10px] md:text-xs font-semibold font-sans border"
                  :class="
                    task.task_type === 'ARRANGER'
                      ? 'bg-chapel-soft text-status-live border-chapel-soft'
                      : 'bg-inset text-ink border-rule-strong'
                  "
                >
                  {{ task.zone_name }}
                  <span class="text-xs font-medium ml-1 opacity-70">{{
                    task.task_type === "ARRANGER" ? "Arrange" : "Scan"
                  }}</span>
                </span>
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-col gap-1 items-start">
                <span
                  v-for="task in user.secondaryTasks"
                  :key="task.zone_name"
                  class="px-2 py-1 rounded-[2px] text-xs font-semibold font-sans bg-inset text-muted border border-rule"
                >
                  {{ task.zone_name }}
                  <span class="text-xs font-medium ml-1 opacity-70">{{
                    task.task_type === "ARRANGER" ? "Arrange" : "Scan"
                  }}</span>
                </span>
                <span
                  v-if="user.secondaryTasks.length === 0"
                  class="text-xs text-muted italic"
                  >None</span
                >
              </div>
            </td>
          </tr>
          <tr v-if="paginatedAndFilteredAssignments.length === 0">
            <td
              colspan="3"
              class="p-8 text-center text-xs text-muted font-medium"
            >
              No personnel found matching your search.
            </td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="totalPages > 1"
        class="mt-4 flex justify-between items-center p-2 rounded-none border border-rule"
      >
        <button
          type="button"
          @click="currentPage--"
          :disabled="currentPage === 1"
          aria-label="Previous page"
          class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white disabled:opacity-30 transition-colors"
        >
          <Icon name="material-symbols:chevron-left" class="text-lg text-ink" />
        </button>
        <span class="text-xs font-medium text-muted font-sans">
          Page <span class="text-ink font-mono">{{ currentPage }}</span> of
          <span class="text-ink font-mono">{{ totalPages }}</span>
        </span>
        <button
          type="button"
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          aria-label="Next page"
          class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white disabled:opacity-30 transition-colors"
        >
          <Icon
            name="material-symbols:chevron-right"
            class="text-lg text-ink"
          />
        </button>
      </div>
    </div>

    <div
      class="p-6 border-t border-rule bg-inset flex justify-between items-center"
    >
      <p class="text-xs text-muted font-mono">
        Total:
        {{ groupedAssignments.length }}
      </p>

      <button
        v-if="!isReadonly"
        @click="publishRoster"
        :disabled="isPublishing"
        class="bg-chapel text-white px-8 py-3 rounded-md font-semibold font-sans text-sm hover:bg-chapel-strong transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Icon
          v-if="isPublishing"
          name="material-symbols:sync"
          class="text-lg animate-spin"
        />
        <Icon v-else name="material-symbols:publish" class="text-lg" />
        {{ isPublishing ? "Publishing…" : "Publish roster" }}
      </button>
    </div>

    <AvatarViewerModal
      :is-open="isViewerOpen"
      :image-url="viewerImageUrl"
      :fallback-initials="viewerInitials"
      @close="isViewerOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useAppToast } from "~/composables/useAppToast";

const props = defineProps({
  eventId: String,
  proposal: Object,
  isReadonly: { type: Boolean, default: false },
});

const emit = defineEmits(["published", "discard"]);
const toast = useAppToast();
const isPublishing = ref(false);

const searchQuery = ref("");
const sortOrder = ref("name_asc");
const currentPage = ref(1);
const itemsPerPage = 20;

// --- NEW VIEWER STATE ---
const isViewerOpen = ref(false);
const viewerImageUrl = ref(null);
const viewerInitials = ref("");

const openAvatarViewer = (user) => {
  viewerImageUrl.value = user.avatar_url;
  viewerInitials.value =
    user.first_name?.charAt(0) || user.username?.charAt(0) || "U";
  isViewerOpen.value = true;
};

watch(searchQuery, () => {
  currentPage.value = 1;
});

const groupedAssignments = computed(() => {
  if (!props.proposal || !props.proposal.proposedAssignments) return [];

  const userMap = {};

  props.proposal.proposedAssignments.forEach((assignment) => {
    const userId = assignment.user_id;
    const userData = assignment.user || {
      username: "Unknown",
      unit: "Unknown",
      avatar_url: null,
      first_name: null,
    };

    if (!userMap[userId]) {
      userMap[userId] = {
        id: userId,
        username: userData.username,
        unit: userData.unit,
        avatar_url: userData.avatar_url, // NEW: Capture Avatar Data
        first_name: userData.first_name, // NEW: Capture First Name for fallback
        primaryTasks: [],
        secondaryTasks: [],
      };
    }

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

// --- NEW HELPER: Universal Search Filter ---
const matchesSearch = (user, query) => {
  const q = query.toLowerCase();

  // 1. Check if name or unit matches
  if (
    user.username.toLowerCase().includes(q) ||
    user.unit.toLowerCase().includes(q)
  ) {
    return true;
  }

  // 2. Check if ANY of their Primary Zones match (e.g., typing "1" matches "A1" or "Columns 1 to 2")
  const primaryMatch = user.primaryTasks.some((task) =>
    task.zone_name.toLowerCase().includes(q),
  );
  if (primaryMatch) return true;

  // 3. Check if ANY of their Secondary Zones match
  const secondaryMatch = user.secondaryTasks.some((task) =>
    task.zone_name.toLowerCase().includes(q),
  );
  if (secondaryMatch) return true;

  return false;
};

const paginatedAndFilteredAssignments = computed(() => {
  let result = [...groupedAssignments.value];

  // Apply the new deep search!
  if (searchQuery.value) {
    result = result.filter((u) => matchesSearch(u, searchQuery.value));
  }

  result.sort((a, b) => {
    if (sortOrder.value === "name_asc") {
      return a.username.localeCompare(b.username);
    } else if (sortOrder.value === "name_desc") {
      return b.username.localeCompare(a.username);
    } else if (sortOrder.value === "unit") {
      const unitCompare = a.unit.localeCompare(b.unit);
      if (unitCompare !== 0) return unitCompare;
      return a.username.localeCompare(b.username);
    } else if (sortOrder.value === "zone") {
      // Sort by Zone Name (Alphanumerically)
      const zoneA =
        a.primaryTasks[0]?.zone_name || a.secondaryTasks[0]?.zone_name || "ZZZ";
      const zoneB =
        b.primaryTasks[0]?.zone_name || b.secondaryTasks[0]?.zone_name || "ZZZ";

      const zoneCompare = zoneA.localeCompare(zoneB, undefined, {
        numeric: true,
      });
      if (zoneCompare !== 0) return zoneCompare;
      return a.username.localeCompare(b.username);
    }
    return 0;
  });

  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return result.slice(start, end);
});

const totalPages = computed(() => {
  let result = [...groupedAssignments.value];

  // Apply the same deep search to the pagination counter!
  if (searchQuery.value) {
    result = result.filter((u) => matchesSearch(u, searchQuery.value));
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
    emit("published");
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
  animation: fadeIn 180ms ease-out forwards;
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
