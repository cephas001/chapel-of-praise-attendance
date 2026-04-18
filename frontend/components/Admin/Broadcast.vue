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
          class="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center shrink-0"
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
            Live Alerts & Inbox
          </p>
        </div>
      </div>
      <div
        class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center transition-transform duration-300 shrink-0"
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
          <form @submit.prevent="sendBroadcast" class="space-y-6">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-500 font-poppins"
                >
                  Recipient Target
                </label>
                <Icon
                  v-if="isLoadingUsers"
                  name="material-symbols:sync"
                  class="animate-spin text-gray-400 text-sm"
                />
              </div>

              <div class="flex gap-2 p-1 bg-gray-200/70 rounded-xl">
                <button
                  type="button"
                  @click="targetMode = 'ALL'"
                  class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all font-poppins flex items-center justify-center gap-2"
                  :class="
                    targetMode === 'ALL'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-500 hover:text-black'
                  "
                >
                  <Icon name="material-symbols:group" class="text-lg" />
                  All Personnel
                </button>
                <button
                  type="button"
                  @click="targetMode = 'SPECIFIC'"
                  class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all font-poppins flex items-center justify-center gap-2"
                  :class="
                    targetMode === 'SPECIFIC'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-500 hover:text-black'
                  "
                >
                  <Icon name="material-symbols:person-search" class="text-lg" />
                  Specific Users
                </button>
              </div>
            </div>

            <div
              v-if="targetMode === 'SPECIFIC'"
              class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fade-in"
            >
              <div
                class="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-gray-50"
              >
                <div class="relative flex-grow">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  >
                    <Icon
                      name="material-symbols:search"
                      class="text-gray-400 text-lg"
                    />
                  </div>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search personnel..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs font-poppins focus:border-black outline-none transition-colors"
                  />
                </div>
                <select
                  v-model="sortOrder"
                  class="border border-gray-300 rounded-lg px-3 py-2 text-xs font-poppins bg-white focus:border-black outline-none cursor-pointer min-w-[130px]"
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="unit">Unit Group</option>
                </select>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="user in paginatedUsers"
                      :key="user.id"
                      @click="toggleUserSelection(user.id)"
                      class="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                      <td class="p-3 pl-4 w-10">
                        <div
                          class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                          :class="
                            selectedUsers.includes(user.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 group-hover:border-blue-400 bg-white'
                          "
                        >
                          <Icon
                            v-if="selectedUsers.includes(user.id)"
                            name="material-symbols:check"
                            class="text-white text-sm"
                          />
                        </div>
                      </td>
                      <td class="p-3">
                        <span
                          class="font-bold text-sm font-poppins text-black block"
                          >{{ user.username }}</span
                        >
                      </td>
                      <td class="p-3 text-right pr-4">
                        <span
                          class="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                        >
                          {{ user.unit }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="paginatedUsers.length === 0">
                      <td
                        colspan="3"
                        class="p-6 text-center text-xs text-gray-400 font-medium font-poppins"
                      >
                        No users found matching "{{ searchQuery }}"
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                class="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center"
              >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-blue-600 font-poppins"
                >
                  {{ selectedUsers.length }} Selected
                </span>

                <div v-if="totalPages > 1" class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    class="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    <Icon
                      name="material-symbols:chevron-left"
                      class="text-gray-600"
                    />
                  </button>
                  <span class="text-[10px] font-bold text-gray-500">
                    {{ currentPage }} / {{ totalPages }}
                  </span>
                  <button
                    type="button"
                    @click="currentPage++"
                    :disabled="currentPage === totalPages"
                    class="w-7 h-7 flex items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    <Icon
                      name="material-symbols:chevron-right"
                      class="text-gray-600"
                    />
                  </button>
                </div>
              </div>
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
                :disabled="isSubmitDisabled"
                class="w-full bg-black text-white font-bold font-poppins py-4 rounded-xl shadow-md hover:bg-gray-900 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50 transition-all"
              >
                <Icon
                  v-if="isSending"
                  name="material-symbols:sync"
                  class="animate-spin text-lg"
                />
                <Icon v-else name="material-symbols:send" class="text-lg" />
                {{ isSending ? "Dispatching..." : "Dispatch Message" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "~/composables/useToast";

const toast = useToast();
const isOpen = ref(false);
const isSending = ref(false);
const isLoadingUsers = ref(false);

const users = ref([]);
const targetMode = ref("ALL"); // 'ALL' or 'SPECIFIC'
const selectedUsers = ref([]); // Array of user IDs

const payload = ref({
  title: "Admin Alert",
  body: "",
});

// Table State
const searchQuery = ref("");
const sortOrder = ref("name_asc");
const currentPage = ref(1);
const itemsPerPage = 5; // Keep the broadcast UI compact

// Reset pagination when search query changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Fetch all users so the Super Admin can target specific individuals
const fetchUsers = async () => {
  isLoadingUsers.value = true;
  try {
    const data = await useApiFetch("/users/directory");

    users.value = data;
  } catch (error) {
    console.error("Failed to load users for broadcast target", error);
  } finally {
    isLoadingUsers.value = false;
  }
};

// Computed property for filtering and sorting users
const filteredAndSortedUsers = computed(() => {
  let result = [...users.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.unit.toLowerCase().includes(query),
    );
  }

  result.sort((a, b) => {
    if (sortOrder.value === "name_asc") {
      return a.username.localeCompare(b.username);
    } else if (sortOrder.value === "name_desc") {
      return b.username.localeCompare(a.username);
    } else if (sortOrder.value === "unit") {
      const unitCompare = a.unit.localeCompare(b.unit);
      if (unitCompare !== 0) return unitCompare;
      return a.username.localeCompare(b.username);
    }
    return 0;
  });

  return result;
});

// Computed property for pagination
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAndSortedUsers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredAndSortedUsers.value.length / itemsPerPage) || 1;
});

// Toggle individual user selection
const toggleUserSelection = (userId) => {
  const index = selectedUsers.value.indexOf(userId);
  if (index > -1) {
    selectedUsers.value.splice(index, 1);
  } else {
    selectedUsers.value.push(userId);
  }
};

// Validation for the submit button
const isSubmitDisabled = computed(() => {
  if (isSending.value) return true;
  if (!payload.value.title || !payload.value.body) return true;
  if (targetMode.value === "SPECIFIC" && selectedUsers.value.length === 0)
    return true;
  return false;
});

const sendBroadcast = async () => {
  isSending.value = true;

  const targetArray =
    targetMode.value === "ALL" ? [] : [...selectedUsers.value];

  try {
    const response = await useApiFetch("/messages/broadcast", {
      method: "POST",
      body: {
        title: payload.value.title,
        body: payload.value.body,
        targetUserIds: targetArray,
      },
    });

    toast.success(response.message || "Alert dispatched to inboxes!");

    // Clear the form on success
    payload.value.body = "";
    selectedUsers.value = []; // Reset selections
  } catch (error) {
    toast.error(error.data?.error || "Failed to dispatch message.");
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
  max-height: 1000px;
  opacity: 1;
  overflow: hidden;
}
.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
