<template>
  <div class="min-h-screen relative bg-gray-50 font-montserrat">
    <VitePwaManifest />
    <NavBar />
    <div :class="token ? 'pt-24' : ''">
      <NuxtPage />
    </div>
    <LazyPwaUpdater />
    <LazyPwaInstallPrompt />
    <ToastContainer />
    <ConfirmModal />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { useMessages } from "~/composables/useMessages";

const { startListening, stopListening, loadInbox } = useMessages();
const { token } = useAuth();

onMounted(() => {
  if (token.value) {
    loadInbox();
    startListening();
  }
});

onBeforeUnmount(() => {
  stopListening();
});
</script>
