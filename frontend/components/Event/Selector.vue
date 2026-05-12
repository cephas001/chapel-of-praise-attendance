<template>
  <section
    class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300"
  >
    <button
      @click="$emit('update:isOpen', !isOpen)"
      class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
    >
      <div class="flex items-center gap-3">
        <h2 class="text-md font-black font-poppins flex items-center gap-2 m-0">
          <Icon :name="icon" class="text-lg text-black" />
          {{ title }}
          <Icon
            v-if="isLoading"
            name="material-symbols:sync"
            class="animate-spin text-gray-400 ml-1"
          />
        </h2>
        <span
          v-if="showTotal"
          class="bg-gray-100 text-[10px] font-bold font-poppins px-2 py-0.5 rounded-md uppercase tracking-widest text-gray-500 border border-gray-200"
        >
          {{ events.length }} Total
        </span>
      </div>
      <div
        class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
      >
        <Icon
          name="material-symbols:keyboard-arrow-down"
          class="text-xl text-black"
        />
      </div>
    </button>

    <Transition name="accordion">
      <div v-show="isOpen">
        <div
          class="border-t border-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar bg-gray-50/30"
        >
          <div
            v-if="events.length === 0"
            class="p-8 text-center text-gray-500 font-medium text-sm"
          >
            {{ isLoading ? "Loading events..." : emptyMessage }}
          </div>

          <div v-else class="divide-y divide-gray-100">
            <button
              v-for="event in events"
              :key="event.id"
              @click="$emit('select', event)"
              class="w-full p-5 sm:p-6 flex items-center justify-between group transition-all duration-200 cursor-pointer border-l-4 text-left"
              :class="
                selectedId === event.id
                  ? 'border-black bg-gray-100/80 shadow-inner'
                  : 'border-transparent bg-white hover:bg-gray-50 hover:border-gray-300'
              "
            >
              <div class="flex items-center gap-4">
                <div
                  class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-colors"
                  :class="
                    selectedId === event.id
                      ? 'bg-black text-white shadow-md'
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
                      selectedId === event.id
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
                  v-if="showStatus && event.status"
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
                  {{ event.status.replace("_ACTIVE", "").replace("_", " ") }}
                </span>

                <Icon
                  :name="
                    selectedId === event.id
                      ? 'material-symbols:check-circle'
                      : 'material-symbols:chevron-right'
                  "
                  class="text-xl transition-colors"
                  :class="
                    selectedId === event.id
                      ? 'text-black'
                      : 'text-gray-300 group-hover:text-black'
                  "
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
defineProps({
  events: { type: Array, required: true },
  selectedId: { type: [String, Number], default: null },
  isLoading: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: true },

  // Customization Props
  title: { type: String, default: "Select Event" },
  icon: { type: String, default: "material-symbols:event-list" },
  emptyMessage: { type: String, default: "No active events found." },
  showStatus: { type: Boolean, default: false },
  showTotal: { type: Boolean, default: false },
});

defineEmits(["select", "update:isOpen"]);
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

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px;
  opacity: 1;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
