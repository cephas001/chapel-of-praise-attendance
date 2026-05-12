<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
    <main class="pt-8 p-6 lg:px-8 max-w-4xl mx-auto">
      <header
        class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat flex items-center gap-3"
          >
            <Icon name="material-symbols:inbox" />
            Inbox
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            Your personal alerts and updates.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="loadInbox"
            class="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
            title="Refresh Inbox"
          >
            <Icon
              name="material-symbols:refresh"
              class="text-xl text-gray-700"
            />
          </button>
        </div>
      </header>

      <div
        v-if="inbox.length === 0"
        class="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm flex flex-col items-center justify-center text-center h-75"
      >
        <div
          class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300"
        >
          <Icon
            name="material-symbols:mark-email-read-outline"
            class="text-3xl"
          />
        </div>
        <h2 class="text-xl font-black text-black font-montserrat mb-2">
          You're all caught up!
        </h2>
        <p class="text-sm text-gray-500 max-w-xs font-poppins">
          No messages in your inbox right now.
        </p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="message in inbox"
          :key="message.id"
          class="bg-white rounded-2xl p-6 shadow-sm border transition-all duration-200"
          :class="
            message.is_read
              ? 'border-gray-100 opacity-75'
              : 'border-blue-200 border-l-4 border-l-blue-600'
          "
        >
          <div class="flex justify-between items-start gap-4">
            <div class="grow">
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="!message.is_read"
                  class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"
                ></span>
                <h3
                  class="text-lg font-black font-poppins text-black"
                  :class="{ 'text-gray-600': message.is_read }"
                >
                  {{ message.title }}
                </h3>
              </div>
              <p
                class="text-sm text-gray-600 font-poppins leading-relaxed mt-2"
              >
                {{ message.body }}
              </p>
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-4"
              >
                {{ new Date(message.created_at).toLocaleString() }}
              </p>
            </div>

            <div class="flex flex-col gap-2 shrink-0">
              <button
                v-if="!message.is_read"
                @click="markAsRead(message.id)"
                class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
                title="Mark as Read"
              >
                <Icon name="material-symbols:check" class="text-lg" />
              </button>
              <button
                @click="deleteMessage(message.id)"
                class="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors"
                title="Delete Message"
              >
                <Icon name="material-symbols:delete-outline" class="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useMessages } from "~/composables/useMessages";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";

const { inbox, loadInbox, markAsRead, deleteMessage } = useMessages();
const { token } = useAuth();
const router = useRouter();

onMounted(() => {
  if (!token.value) return router.push("/login");
  loadInbox();
});
</script>
