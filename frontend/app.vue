<template>
  <div class="min-h-screen relative bg-gray-50 font-montserrat">
    <VitePwaManifest />
    <NavBar />
    <div :class="token ? 'pt-24' : ''"><NuxtPage /></div>
    <LazyPwaUpdater />
    <LazyPwaInstallPrompt />
    <ToastContainer />
  </div>
</template>

<script setup>
const { token } = useAuth();
</script>
