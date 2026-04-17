<template>
  <div
    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in mb-6"
  >
    <div
      class="p-5 sm:p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50"
    >
      <div
        class="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md"
      >
        <Icon name="material-symbols:assignment-ind-outline" class="text-xl" />
      </div>
      <div>
        <h2 class="text-md font-black font-poppins text-black tracking-tight">
          My Duty Post
        </h2>
        <p class="text-xs font-medium text-gray-500 font-poppins">
          Your official assignment for this service
        </p>
      </div>
    </div>

    <div class="p-5 sm:p-6">
      <div v-if="isLoading" class="flex justify-center py-6">
        <Icon
          name="material-symbols:sync"
          class="animate-spin text-3xl text-gray-300"
        />
      </div>

      <div
        v-else-if="assignments.length === 0"
        class="text-center py-6 bg-gray-50 rounded-xl border border-gray-100"
      >
        <Icon
          name="material-symbols:coffee-outline"
          class="text-3xl text-gray-400 mb-2"
        />
        <h3 class="text-sm font-bold font-poppins text-gray-700">
          Standby / Rest
        </h3>
        <p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          You have not been assigned a specific primary duty for this event.
          Please assist where needed or take a well-deserved rest!
        </p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div v-if="arrangerTasks.length > 0" class="space-y-2">
          <h4
            class="text-[10px] font-bold uppercase tracking-widest text-black"
          >
            Arrangement Duty
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="task in arrangerTasks"
              :key="task.id"
              class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <span
                  class="block text-sm font-black font-montserrat text-blue-900"
                  >{{ task.zone_name }}</span
                >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-blue-600"
                  >Arrange Attendees</span
                >
              </div>
              <Icon
                name="material-symbols:chair-outline"
                class="text-2xl text-blue-300"
              />
            </div>
          </div>
        </div>

        <div
          v-if="scannerTasks.length > 0"
          class="space-y-2"
          :class="{ 'pt-2 border-t border-gray-100': arrangerTasks.length > 0 }"
        >
          <h4
            class="text-[10px] font-bold uppercase tracking-widest text-black"
          >
            Scanning Duty
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="task in primaryScannerTasks"
              :key="task.id"
              class="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <span
                  class="block text-sm font-black font-montserrat text-green-900"
                  >{{ task.zone_name }}</span
                >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-green-600"
                  >Primary Column</span
                >
              </div>
              <Icon
                name="material-symbols:qr-code-scanner"
                class="text-2xl text-green-400"
              />
            </div>

            <div
              v-for="task in secondaryScannerTasks"
              :key="task.id"
              class="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <span
                  class="block text-sm font-black font-montserrat text-orange-900"
                  >{{ task.zone_name }}</span
                >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-orange-600"
                  >Low Traffic
                </span>
              </div>
              <Icon
                name="material-symbols:shield-outline"
                class="text-2xl text-orange-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  eventId: {
    type: String,
    required: true,
  },
});

const isLoading = ref(true);
const assignments = ref([]);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await useApiFetch(`/roster/${props.eventId}/my-duty`);
    assignments.value = data || [];
  } catch (error) {
    console.error("Failed to fetch duty", error);
  } finally {
    isLoading.value = false;
  }
};

// Computed properties to cleanly split the tasks for the UI
const arrangerTasks = computed(() =>
  assignments.value.filter((a) => a.task_type === "ARRANGER"),
);
const scannerTasks = computed(() =>
  assignments.value.filter((a) => a.task_type === "SCANNER"),
);

const primaryScannerTasks = computed(() =>
  scannerTasks.value.filter((a) => a.is_primary),
);
const secondaryScannerTasks = computed(() =>
  scannerTasks.value.filter((a) => !a.is_primary),
);

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
