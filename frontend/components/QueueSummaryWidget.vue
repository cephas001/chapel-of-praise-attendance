<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div class="flex justify-between items-center mb-4">
      <span class="text-xs font-bold text-gray-400 uppercase tracking-widest"
        >Local Queue</span
      >
      <span
        v-if="isSyncing"
        class="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
      >
        <Icon name="material-symbols:sync" class="text-sm animate-spin" />
        Syncing
      </span>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p class="text-2xl font-black text-black font-montserrat">
          {{ pendingCount }}
        </p>
        <p
          class="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1"
        >
          Pending
        </p>
      </div>

      <button
        @click="$emit('viewRejections')"
        class="p-4 bg-gray-50 rounded-xl border border-gray-100 text-left hover:bg-red-50/50 transition-colors group relative"
      >
        <p class="text-2xl font-black text-red-600 font-montserrat">
          {{ rejectedCount }}
        </p>
        <div class="flex items-center justify-between mt-1">
          <p
            class="text-[10px] font-bold text-gray-500 uppercase tracking-wide"
          >
            Rejections
          </p>
          <Icon
            name="material-symbols:chevron-right"
            class="text-gray-400 group-hover:text-red-600 transition-colors text-lg"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pendingCount: { type: Number, required: true },
  rejectedCount: { type: Number, required: true },
  isSyncing: { type: Boolean, default: false },
});

defineEmits(["viewRejections"]);
</script>
