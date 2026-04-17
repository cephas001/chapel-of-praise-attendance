<template>
  <div class="min-h-screen relative bg-gray-50 font-montserrat">
    <VitePwaManifest />
    <NavBar />
    <div :class="token ? 'pt-24' : ''"><NuxtPage /></div>
    <LazyPwaUpdater />
    <LazyPwaInstallPrompt />
    <ToastContainer />
    <ConfirmModal />
  </div>
</template>

<script setup>
import { useWebPush } from "~/composables/useWebPush";

const { initPushNotifications } = useWebPush();
const { token } = useAuth();

onMounted(() => {
  if (token.value) {
    initPushNotifications();
  }
});
</script>
