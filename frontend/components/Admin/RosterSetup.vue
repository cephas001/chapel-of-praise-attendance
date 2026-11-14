<template>
  <div
    class="bg-white rounded-none border border-rule overflow-hidden"
    v-if="eventId"
  >
    <!-- <div
      class="p-6 sm:p-8 border-b border-rule bg-ink text-white flex justify-between items-center"
    >
      <div>
        <h2
          class="text-lg font-bold font-sans flex items-center gap-2"
        >
          <Icon name="material-symbols:engineering" class="text-xl" />
          Roster generation
        </h2>
        <p class="text-xs text-gray-300 font-medium mt-1">
          Configure parameters before assigning personnel.
        </p>
      </div>
    </div> -->

    <div v-if="isLoading" class="p-12 flex justify-center items-center">
      <Icon
        name="material-symbols:sync"
        class="animate-spin text-3xl text-muted"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-rule"
    >
      <div class="p-6 sm:p-8">
        <div class="flex-col mb-8">
          <div>
            <h3 class="text-xs md:text-sm font-semibold font-sans text-ink">
              Team availability
            </h3>
            <p class="text-[11px] text-xs text-muted mt-1 font-sans">
              Uncheck personnel who are absent today.
            </p>
          </div>
          <span
            class="text-[11px] md:text-xs font-medium text-muted py-1 rounded-md text-center"
          >
            <span class="font-mono">{{ availableUsers.length }}</span> /
            <span class="font-mono">{{ allUsers.length }}</span> available
          </span>
        </div>

        <div
          class="border border-rule rounded-none max-h-[400px] overflow-y-auto bg-inset/50"
        >
          <div
            v-for="user in allUsers"
            :key="user.id"
            class="flex items-center justify-between p-3 border-b border-rule last:border-0 hover:bg-white transition-colors"
          >
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="w-8 h-8 rounded-[2px] border border-rule bg-inset flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-colors"
                :aria-label="`View ${user.username}'s profile picture`"
                @click.stop.prevent="openAvatarViewer(user)"
              >
                <img
                  v-if="user.avatar_url"
                  :src="user.avatar_url"
                  loading="lazy"
                  alt="Avatar"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs font-semibold text-muted">
                  {{ user.first_name?.charAt(0) || user.username?.charAt(0) }}
                </span>
              </button>

              <div>
                <span
                  class="font-semibold text-xs md:text-sm font-sans text-ink block"
                >
                  {{ user.username }}
                </span>
                <span
                  class="text-[11px] md:text-xs font-medium text-muted capitalize"
                >
                  {{ (user.unit || "").replace(/_/g, " ").toLowerCase() }}
                </span>
              </div>
            </div>

            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :value="user"
                v-model="availableUsers"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-300 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-black peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-rule-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-ink"
              ></div>
            </label>
          </div>
        </div>
      </div>

      <div class="p-6 sm:p-8">
        <div class="flex justify-between items-end mb-6">
          <div>
            <h3 class="text-xs md:text-sm font-semibold font-sans text-ink">
              Chapel layout
            </h3>
            <p class="text-[11px] md:text-xs text-muted mt-1 font-sans">
              Select active zones. Mark late alphabet columns as Low Traffic.
            </p>
          </div>
        </div>

        <div
          class="flex justify-between items-center bg p-4 rounded-none border border-chapel-soft mb-6"
        >
          <div>
            <h4
              class="text-xs md:text-sm font-semibold text-status-live font-sans"
            >
              Scanning only mode
            </h4>
            <p class="text-[11px] md:text-xs text-status-live mt-0.5 font-sans">
              Roster everyone to scan.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="scanningOnly"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-chapel-soft rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-black peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-rule-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:bg-chapel"
            ></div>
          </label>
        </div>

        <div class="space-y-6 max-h-[400px] overflow-y-auto pr-2">
          <div
            v-for="(zones, prefix) in groupedZones"
            :key="prefix"
            class="space-y-3"
          >
            <div class="flex justify-between items-center border-b pb-1">
              <h4 class="text-xs font-semibold text-muted">
                Prefix {{ prefix }}
              </h4>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="togglePrefixActive(zones)"
                  class="p-1 rounded-md text-muted hover:text-ink hover:bg-inset transition-colors flex items-center justify-center"
                  title="Toggle All Active/Deactivated"
                  aria-label="Toggle all zones in this prefix"
                >
                  <Icon
                    name="material-symbols:power-settings-new"
                    class="text-sm"
                  />
                </button>
                <button
                  type="button"
                  @click="togglePrefixLowTraffic(zones)"
                  class="p-1 rounded-md text-muted hover:text-ink hover:bg-inset transition-colors flex items-center justify-center"
                  title="Toggle All Low Traffic"
                  aria-label="Toggle low traffic for all zones in this prefix"
                >
                  <Icon name="material-symbols:speed" class="text-sm" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="zone in zones"
                :key="zone.id"
                class="border rounded-none p-3 flex flex-col gap-2 transition-colors"
                :class="
                  activeZones.includes(zone.id)
                    ? 'border-ink bg-ink text-white'
                    : 'border-rule bg-inset hover:border-rule-strong'
                "
              >
                <button
                  type="button"
                  @click="toggleZone(zone.id)"
                  :aria-pressed="activeZones.includes(zone.id)"
                  :aria-label="`${zone.name} ${
                    activeZones.includes(zone.id) ? 'active' : 'inactive'
                  }. Click to toggle.`"
                  class="font-semibold font-mono text-center block w-full text-xs tracking-wide"
                  :class="
                    activeZones.includes(zone.id) ? 'text-white' : 'text-ink'
                  "
                >
                  {{ zone.name }}
                </button>

                <button
                  v-if="activeZones.includes(zone.id)"
                  type="button"
                  @click="toggleLowTraffic(zone.id)"
                  :aria-pressed="lowTrafficZones.includes(zone.id)"
                  :aria-label="`${zone.name} traffic: ${
                    lowTrafficZones.includes(zone.id)
                      ? 'low traffic'
                      : 'high traffic'
                  }. Click to toggle.`"
                  class="text-[11px] md:text-xs font-semibold py-0.5 px-2 rounded-md w-full transition-colors"
                  :class="
                    lowTrafficZones.includes(zone.id)
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink hover:bg-inset'
                  "
                >
                  {{
                    lowTrafficZones.includes(zone.id)
                      ? "Low traffic"
                      : "High traffic"
                  }}
                </button>
                <span
                  v-else
                  class="text-xs font-semibold py-1 px-2 rounded-[2px] w-full text-center bg-gray-200 text-muted"
                >
                  Deactivated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-rule bg-inset flex justify-end">
      <button
        @click="runAlgorithm"
        :disabled="isGenerating"
        class="bg-chapel text-white px-6 py-3 font-semibold font-sans text-sm hover:bg-chapel-strong transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        {{ isGenerating ? "Generating…" : "Generate roster" }}
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
import { ref, onMounted, computed } from "vue";
import { useAppToast } from "~/composables/useAppToast";

const props = defineProps({
  eventId: String,
});

const emit = defineEmits(["rosterGenerated"]);
const toast = useAppToast();
const isGenerating = ref(false);
const isLoading = ref(true);

const scanningOnly = ref(false);

const allUsers = ref([]);
const availableUsers = ref([]);

const allZones = ref([]);
const activeZones = ref([]);
const lowTrafficZones = ref([]);

// --- NEW VIEWER STATE ---
const isViewerOpen = ref(false);
const viewerImageUrl = ref(null);
const viewerInitials = ref("");

const openAvatarViewer = (user) => {
  viewerImageUrl.value = user.avatar_url;
  viewerInitials.value = user.first_name?.charAt(0) || user.username?.charAt(0);
  isViewerOpen.value = true;
};

// The API caps a page at 100 rows, so asking for limit=1000 silently returns
// 100. Walk every page and merge the results so the algorithm always sees the
// complete team. Pages after the first are fetched in parallel.
const USERS_PAGE_SIZE = 100;

const fetchAllUsers = async () => {
  const firstPage = await useApiFetch(
    `/users?limit=${USERS_PAGE_SIZE}&page=1&sort=asc`,
  );

  const users = Array.isArray(firstPage?.users) ? [...firstPage.users] : [];
  const totalPages = Math.max(
    1,
    Number(firstPage?.pagination?.totalPages) || 1,
  );

  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        useApiFetch(
          `/users?limit=${USERS_PAGE_SIZE}&page=${index + 2}&sort=asc`,
        ),
      ),
    );

    for (const page of remainingPages) {
      if (Array.isArray(page?.users)) users.push(...page.users);
    }
  }

  // A user created or removed between page requests can shift a row across a
  // boundary; de-duplicating by id keeps the availability list clean.
  const byId = new Map();
  for (const user of users) {
    if (user?.id) byId.set(user.id, user);
  }

  return [...byId.values()];
};

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [users, zonesData] = await Promise.all([
      fetchAllUsers(),
      useApiFetch(`/zones`),
    ]);

    allUsers.value = users.filter((u) => u.role !== "SUPER_ADMIN");
    availableUsers.value = [...allUsers.value];

    allZones.value = zonesData;
    activeZones.value = allZones.value.map((z) => z.id);
  } catch (error) {
    console.error("Setup error:", error);
  } finally {
    isLoading.value = false;
  }
};

const groupedZones = computed(() => {
  return allZones.value.reduce((acc, zone) => {
    if (!acc[zone.prefix]) acc[zone.prefix] = [];
    acc[zone.prefix].push(zone);
    return acc;
  }, {});
});

const toggleZone = (id) => {
  if (activeZones.value.includes(id)) {
    activeZones.value = activeZones.value.filter((z) => z !== id);
    lowTrafficZones.value = lowTrafficZones.value.filter((z) => z !== id);
  } else {
    activeZones.value.push(id);
  }
};

const toggleLowTraffic = (id) => {
  if (lowTrafficZones.value.includes(id)) {
    lowTrafficZones.value = lowTrafficZones.value.filter((z) => z !== id);
  } else {
    lowTrafficZones.value.push(id);
  }
};

const togglePrefixActive = (zones) => {
  const zoneIds = zones.map((z) => z.id);
  const allInactive = zoneIds.every((id) => !activeZones.value.includes(id));

  if (allInactive) {
    zoneIds.forEach((id) => {
      if (!activeZones.value.includes(id)) activeZones.value.push(id);
    });
  } else {
    activeZones.value = activeZones.value.filter((id) => !zoneIds.includes(id));
    lowTrafficZones.value = lowTrafficZones.value.filter(
      (id) => !zoneIds.includes(id),
    );
  }
};

const togglePrefixLowTraffic = (zones) => {
  const activeZoneIds = zones
    .map((z) => z.id)
    .filter((id) => activeZones.value.includes(id));
  if (activeZoneIds.length === 0) return;

  const allLowTraffic = activeZoneIds.every((id) =>
    lowTrafficZones.value.includes(id),
  );

  if (allLowTraffic) {
    lowTrafficZones.value = lowTrafficZones.value.filter(
      (id) => !activeZoneIds.includes(id),
    );
  } else {
    activeZoneIds.forEach((id) => {
      if (!lowTrafficZones.value.includes(id)) lowTrafficZones.value.push(id);
    });
  }
};

const runAlgorithm = async () => {
  if (activeZones.value.length === 0) {
    toast.warning(
      "Select at least one active zone before generating a roster.",
    );
    return;
  }

  if (availableUsers.value.length === 0) {
    toast.warning(
      "Add at least one available team member before generating a roster.",
    );
    return;
  }

  isGenerating.value = true;

  try {
    const payload = {
      availableUserIds: availableUsers.value.map((u) => u.id),
      activeZoneIds: activeZones.value,
      lowTrafficZoneIds: lowTrafficZones.value,
      scanningOnly: scanningOnly.value,
    };

    const data = await useApiFetch(`/roster/${props.eventId}/generate`, {
      method: "POST",
      body: payload,
    });

    emit("rosterGenerated", data);
  } catch (error) {
    console.error("Algorithm failed:", error);
    toast.error("Couldn't generate the roster. Please try again.");
  } finally {
    isGenerating.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>
