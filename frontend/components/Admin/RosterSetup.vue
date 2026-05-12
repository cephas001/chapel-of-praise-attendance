<template>
  <div
    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-8"
    v-if="eventId"
  >
    <div
      class="p-6 sm:p-8 border-b border-gray-100 bg-black text-white flex justify-between items-center"
    >
      <div>
        <h2
          class="text-lg font-black font-poppins flex items-center gap-2 tracking-wide"
        >
          <Icon name="material-symbols:engineering" class="text-xl" />
          Roster Generation Engine
        </h2>
        <p class="text-xs text-gray-400 font-medium mt-1">
          Configure parameters before assigning personnel.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="p-12 flex justify-center items-center">
      <Icon
        name="material-symbols:sync"
        class="animate-spin text-3xl text-gray-300"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100"
    >
      <div class="p-6 sm:p-8">
        <div class="flex justify-between items-end mb-6">
          <div>
            <h3
              class="text-sm font-black uppercase tracking-widest font-montserrat text-black"
            >
              Team Availability
            </h3>
            <p class="text-xs text-gray-500 mt-1 font-poppins">
              Uncheck personnel who are absent today.
            </p>
          </div>
          <span
            class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg text-center"
          >
            {{ availableUsers.length }} / {{ allUsers.length }} Available
          </span>
        </div>

        <div
          class="border border-gray-200 rounded-xl max-h-[400px] overflow-y-auto bg-gray-50/50"
        >
          <div
            v-for="user in allUsers"
            :key="user.id"
            class="flex items-center justify-between p-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
                @click.stop.prevent="openAvatarViewer(user)"
              >
                <img
                  v-if="user.avatar_url"
                  :src="user.avatar_url"
                  loading="lazy"
                  alt="Avatar"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs font-bold text-gray-400 uppercase">
                  {{ user.first_name?.charAt(0) || user.username?.charAt(0) }}
                </span>
              </div>

              <div>
                <span class="font-bold text-sm font-poppins text-black block">
                  {{ user.username }}
                </span>
                <span
                  class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                >
                  {{ user.unit }}
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
                class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"
              ></div>
            </label>
          </div>
        </div>
      </div>

      <div class="p-6 sm:p-8">
        <div class="flex justify-between items-end mb-6">
          <div>
            <h3
              class="text-sm font-black uppercase tracking-widest font-montserrat text-black"
            >
              Chapel Layout
            </h3>
            <p class="text-xs text-gray-500 mt-1 font-poppins">
              Select active zones. Mark late alphabet columns as Low Traffic.
            </p>
          </div>
        </div>

        <div
          class="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6"
        >
          <div>
            <h4 class="text-sm font-bold text-blue-900 font-montserrat">
              Scanning Only Mode
            </h4>
            <p class="text-[10px] sm:text-xs text-blue-700 mt-0.5 font-poppins">
              Bypass arranging duties and deploy all personnel as scanners.
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="scanningOnly"
              class="sr-only peer"
            />
            <div
              class="w-11 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
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
              <h4
                class="text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Prefix {{ prefix }}
              </h4>
              <div class="flex items-center gap-2">
                <button
                  @click="togglePrefixActive(zones)"
                  class="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title="Toggle All Active/Deactivated"
                >
                  <Icon
                    name="material-symbols:power-settings-new"
                    class="text-sm"
                  />
                </button>
                <button
                  @click="togglePrefixLowTraffic(zones)"
                  class="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center"
                  title="Toggle All Low Traffic"
                >
                  <Icon name="material-symbols:speed" class="text-sm" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="zone in zones"
                :key="zone.id"
                class="border rounded-xl p-3 flex flex-col gap-2 transition-all cursor-pointer"
                :class="
                  activeZones.includes(zone.id)
                    ? 'border-black bg-black text-white shadow-md'
                    : 'border-gray-200 bg-gray-500 hover:border-gray-300'
                "
                @click="toggleZone(zone.id)"
              >
                <span
                  class="font-black font-montserrat text-center block"
                  :class="
                    activeZones.includes(zone.id) ? 'text-white' : 'text-black'
                  "
                >
                  {{ zone.name }}
                </span>

                <button
                  v-if="activeZones.includes(zone.id)"
                  @click.stop="toggleLowTraffic(zone.id)"
                  class="text-[9px] font-bold uppercase tracking-widest py-1 px-2 rounded w-full transition-colors"
                  :class="
                    lowTrafficZones.includes(zone.id)
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-black hover:bg-gray-700'
                  "
                >
                  {{
                    lowTrafficZones.includes(zone.id)
                      ? "Low Traffic"
                      : "High Traffic"
                  }}
                </button>
                <button
                  v-else
                  class="text-[9px] font-bold uppercase tracking-widest py-1 px-2 rounded w-full transition-colors bg-gray-300"
                >
                  Deactivated
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
      <button
        @click="runAlgorithm"
        :disabled="isGenerating"
        class="bg-black text-white px-8 py-3 rounded-xl font-bold font-poppins uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Icon
          v-if="isGenerating"
          name="material-symbols:sync"
          class="text-lg animate-spin"
        />
        <Icon v-else name="material-symbols:memory" class="text-lg" />
        {{ isGenerating ? "Calculating..." : "Run Algorithm" }}
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
import { ref, onMounted, computed } from "vue"; // Ensure path matches your structure

const props = defineProps({
  eventId: String,
});

const emit = defineEmits(["rosterGenerated"]);
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

const fetchData = async () => {
  isLoading.value = true;
  try {
    const [usersData, zonesData] = await Promise.all([
      useApiFetch(`/users?limit=1000&sort=asc`),
      useApiFetch(`/zones`),
    ]);

    allUsers.value = usersData.users.filter((u) => u.role !== "SUPER_ADMIN");
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
    alert("You must have at least one active zone selected.");
    return;
  }

  if (availableUsers.value.length === 0) {
    alert("You must have at least one available team member.");
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
    alert("Failed to run the algorithm. Please try again.");
  } finally {
    isGenerating.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>
