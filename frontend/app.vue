<template>
  <div class="min-h-screen relative bg-gray-50 font-montserrat">
    <VitePwaManifest />
    <NavBar />
    <div :class="token ? 'pt-24' : ''"><NuxtPage /></div>
    <PwaUpdater />
    <PwaInstallPrompt />
  </div>
</template>

<script setup>
const { token } = useAuth();
</script>
