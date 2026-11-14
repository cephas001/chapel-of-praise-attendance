<template>
  <div class="flex items-stretch bg-ink text-white">
    <div class="min-w-0 flex-1 px-4 py-3.5 sm:px-5">
      <p
        class="flex items-center gap-2 truncate font-mono text-[11px] leading-4 text-white/60"
      >
        <span class="h-1.5 w-1.5 rounded-[1px]" :class="dotClass"></span>
        {{ context }}
      </p>
      <p class="mt-0.5 truncate text-[15px] font-semibold leading-tight">
        {{ name }}
      </p>
    </div>

    <div
      class="flex items-center gap-2 border-l border-white/15 pl-3 pr-1 sm:pl-4 sm:pr-2"
    >
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center text-white/65 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close event"
        @click="$emit('close')"
      >
        <Icon name="material-symbols:close" class="text-lg" />
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  context: { type: String, default: "" },
  dotClass: { type: String, default: "bg-status-live" },
});

defineEmits(["close"]);
</script>
