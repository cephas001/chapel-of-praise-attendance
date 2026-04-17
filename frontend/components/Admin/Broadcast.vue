<template>
  <section
    class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden mb-6"
  >
    <button
      @click="isOpen = !isOpen"
      class="w-full p-6 sm:p-8 flex justify-between items-center bg-black text-white hover:bg-gray-900 transition-colors focus:outline-none"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center"
        >
          <Icon name="material-symbols:campaign" class="text-xl text-white" />
        </div>
        <div class="text-left">
          <h2
            class="text-md font-black font-poppins m-0 tracking-wide uppercase"
          >
            Live Broadcast
          </h2>
          <p
            class="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-0.5"
          >
            Push Notifications
          </p>
        </div>
      </div>
      <div
        class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
      >
        <Icon
          name="material-symbols:keyboard-arrow-down"
          class="text-xl text-white"
        />
      </div>
    </button>

    <Transition name="accordion">
      <div v-show="isOpen">
        <div class="p-6 sm:p-8 bg-gray-50/50">
          <form @submit.prevent="sendBroadcast" class="space-y-5">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-500 font-poppins"
                  >Recipient Target</label
                >
                <Icon
                  v-if="isLoadingUsers"
                  name="material-symbols:sync"
                  class="animate-spin text-gray-400 text-sm"
                />
              </div>
              <select
                v-model="targetUser"
                class="w-full border-gray-300 border focus:border-black rounded-xl py-3 px-4 text-black font-poppins outline-none bg-white shadow-sm"
              >
                <option value="ALL" class="font-bold">
                  📢 Broadcast to All Personnel
                </option>
                <optgroup label="Specific Individuals">
                  <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.username }} ({{ user.unit }})
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="space-y-2">
              <label
                class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-500 font-poppins"
                >Message Title</label
              >
              <input
                v-model="payload.title"
                type="text"
                placeholder="e.g. Deployment Alert or Section A Full"
                required
                class="w-full border border-gray-300 focus:border-black rounded-xl py-3 px-4 text-black font-poppins outline-none shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label
                class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-500 font-poppins"
                >Message Body</label
              >
              <textarea
                v-model="payload.body"
                rows="3"
                placeholder="Type your message here..."
                required
                class="w-full border border-gray-300 focus:border-black rounded-xl py-3 px-4 text-black font-poppins outline-none resize-none shadow-sm"
              ></textarea>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="isSending || !payload.title || !payload.body"
                class="w-full bg-blue-600 text-white font-bold font-poppins py-4 rounded-xl shadow-md hover:bg-blue-700 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50 transition-all"
              >
                <Icon
                  v-if="isSending"
                  name="material-symbols:sync"
                  class="animate-spin text-lg"
                />
                <Icon v-else name="material-symbols:send" class="text-lg" />
                {{ isSending ? "Dispatching..." : "Send Push Notification" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useToast } from "~/composables/useToast";

const toast = useToast();
const isOpen = ref(false);
const isSending = ref(false);
const isLoadingUsers = ref(false);

const users = ref([]);
const targetUser = ref("ALL");

const payload = ref({
  title: "Admin Alert",
  body: "",
});

// Fetch all users so the Super Admin can target specific individuals
const fetchUsers = async () => {
  isLoadingUsers.value = true;
  try {
    const data = await useApiFetch("/users");
    users.value = data.users.sort((a, b) =>
      a.username.localeCompare(b.username),
    );
  } catch (error) {
    console.error("Failed to load users for broadcast target", error);
  } finally {
    isLoadingUsers.value = false;
  }
};

const sendBroadcast = async () => {
  isSending.value = true;

  // Format the target array based on the selection
  const targetArray = targetUser.value === "ALL" ? [] : [targetUser.value];

  try {
    const response = await useApiFetch("/notifications/broadcast", {
      method: "POST",
      body: {
        title: payload.value.title,
        body: payload.value.body,
        targetUserIds: targetArray,
      },
    });

    toast.success(response.message || "Message dispatched successfully!");

    // Clear the form on success
    payload.value.body = "";
    // Keep the title as is, in case they want to send multiple alerts of the same type
  } catch (error) {
    toast.error(error.data?.error || "Failed to send broadcast.");
  } finally {
    isSending.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  opacity: 1;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
