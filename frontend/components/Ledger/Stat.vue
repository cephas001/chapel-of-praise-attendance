<template>
  <component
    :is="clickable ? 'button' : 'div'"
    :type="clickable ? 'button' : undefined"
    class="min-w-0 text-left"
    :class="clickable ? 'group' : ''"
  >
    <p
      class="font-mono text-[30px] font-medium leading-none tabular-nums tracking-tight"
      :class="
        tone === 'error' && Number(value) > 0
          ? 'text-status-error'
          : 'text-ink'
      "
    >
      {{ value }}
    </p>
    <p
      class="led-eyebrow mt-2"
      :class="clickable ? 'group-hover:text-ink transition-colors' : ''"
    >
      {{ label }}
    </p>
  </component>
</template>

<script setup>
defineProps({
  value: { type: [Number, String], required: true },
  label: { type: String, required: true },
  tone: { type: String, default: "ink" },
  clickable: { type: Boolean, default: false },
});
</script>
