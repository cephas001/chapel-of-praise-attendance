<template>
  <div class="min-h-screen relative bg-canvas text-ink font-sans">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <VitePwaManifest />
    <NavBar />
    <div id="main-content" tabindex="-1" :class="token ? 'pt-24' : ''">
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </div>
    <LazyPwaInstallPrompt />
    <ToastContainer />
    <LazyConfirmModal />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from "vue";
import { useMessages } from "~/composables/useMessages";

const { startListening, stopListening, loadUnreadCount, clearInbox } =
  useMessages();
const { token } = useAuth();

const syncMessageConnection = () => {
  if (token.value) {
    // Restart if the token changed (for example, a different account logged in
    // without a full page reload) so the stream is authenticated as the
    // current user.
    stopListening();
    clearInbox();
    loadUnreadCount();
    startListening();
    return;
  }

  stopListening();
  clearInbox();
};

// onMounted covers a hard reload with an existing session.
onMounted(() => {
  syncMessageConnection();
});

// The root app stays mounted across router navigation, so this watch is what
// starts the stream after a soft navigation from /login.
watch(token, () => {
  syncMessageConnection();
});

onBeforeUnmount(() => {
  stopListening();
});
</script>
