<template>
  <header
    class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-rule pb-5"
  >
    <div class="min-w-0">
      <p v-if="eyebrow" class="led-eyebrow mb-2">{{ eyebrow }}</p>
      <h1 class="led-display text-[32px] sm:text-[40px]">{{ title }}</h1>
    </div>

    <div class="flex items-center gap-4 pb-1.5">
      <slot name="status" />
      <span
        v-if="$slots.status && $slots.actions"
        class="h-5 w-px bg-rule"
        aria-hidden="true"
      ></span>
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: "" },
});
</script>
