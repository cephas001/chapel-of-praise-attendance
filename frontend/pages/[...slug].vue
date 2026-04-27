<script setup>
definePageMeta({
  middleware: [
    function (to, from) {
      // This runs BEFORE the component attempts to render,
      // preventing the slot warning and the frozen UI.
      return navigateTo("/scanner");
    },
  ],
});
</script>

<template>
  <div>Redirecting...</div>
</template>
