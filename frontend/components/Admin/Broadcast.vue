<template>
  <section
    class="bg-white rounded-none border border-rule transition-colors duration-200 overflow-hidden"
  >
    <button
      @click="isOpen = !isOpen"
      class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-inset transition-colors"
    >
      <div class="flex items-center gap-3">
        <div class="text-left">
          <h2 class="led-display m-0 text-[20px]">Broadcast</h2>
          <p class="text-xs text-gray-700 font-medium mt-0.5">
            Alerts and inbox
          </p>
        </div>
      </div>
      <div
        class="w-8 h-8 rounded-[2px] bg-inset flex items-center justify-center transition-transform duration-300 shrink-0"
        :class="{ 'rotate-180': isOpen }"
      >
        <Icon
          name="material-symbols:keyboard-arrow-down"
          class="text-xl text-ink"
        />
      </div>
    </button>

    <Transition name="accordion">
      <div v-if="isOpen">
        <div class="p-6 sm:p-8 bg-inset/50 mt-2">
          <form @submit.prevent="sendBroadcast" class="space-y-5">
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <label class="text-xs font-semibold text-muted font-mono">
                  Recipient
                </label>
                <Icon
                  v-if="isLoadingUsers"
                  name="material-symbols:sync"
                  class="animate-spin text-muted text-sm"
                />
              </div>

              <div class="flex gap-2 p-1 bg-inset rounded-md">
                <button
                  type="button"
                  @click="targetMode = 'ALL'"
                  class="flex-1 py-2.5 rounded-md text-xs font-semibold transition-colors font-sans flex items-center justify-center gap-2"
                  :class="
                    targetMode === 'ALL'
                      ? 'bg-white text-ink'
                      : 'text-muted hover:text-ink'
                  "
                >
                  All
                </button>
                <button
                  type="button"
                  @click="targetMode = 'SPECIFIC'"
                  class="flex-1 py-2.5 rounded-md text-xs font-semibold transition-colors font-sans flex items-center justify-center gap-2"
                  :class="
                    targetMode === 'SPECIFIC'
                      ? 'bg-white text-ink'
                      : 'text-muted hover:text-ink'
                  "
                >
                  <Icon name="material-symbols:person-search" class="text-lg" />
                  Specific
                </button>
              </div>
            </div>

            <div
              v-if="targetMode === 'SPECIFIC'"
              class="bg-white border border-rule rounded-none overflow-hidden animate-fade-in"
            >
              <div
                class="p-4 border-b border-rule flex flex-col sm:flex-row gap-3 bg-inset"
              >
                <div class="relative flex-grow">
                  <div
                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  >
                    <Icon
                      name="material-symbols:search"
                      class="text-muted text-lg"
                    />
                  </div>
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search personnel..."
                    class="w-full pl-10 pr-4 py-2 border border-rule-strong text-xs font-sans transition-colors focus-visible:border-chapel"
                  />
                </div>
                <select
                  v-model="sortOrder"
                  class="border border-rule-strong px-3 py-2 text-xs font-sans bg-white focus-visible:border-chapel cursor-pointer min-w-[130px]"
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="unit">Unit Group</option>
                </select>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <tbody class="divide-y divide-rule">
                    <tr
                      v-for="user in paginatedUsers"
                      :key="user.id"
                      role="checkbox"
                      tabindex="0"
                      :aria-checked="selectedUsers.includes(user.id)"
                      :aria-label="`Select ${user.username}`"
                      @click="toggleUserSelection(user.id)"
                      @keydown.enter.prevent="toggleUserSelection(user.id)"
                      @keydown.space.prevent="toggleUserSelection(user.id)"
                      class="hover:bg-inset/60 focus-visible:bg-inset/60 transition-colors cursor-pointer group"
                    >
                      <td class="p-3 pl-4 w-10">
                        <div
                          aria-hidden="true"
                          class="w-5 h-5 rounded-sm border flex items-center justify-center transition-colors"
                          :class="
                            selectedUsers.includes(user.id)
                              ? 'bg-chapel border-chapel'
                              : 'border-rule-strong group-hover:border-chapel bg-white'
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
                          class="font-semibold text-xs md:text-sm font-sans text-ink block"
                          >{{ user.username }}</span
                        >
                      </td>
                      <td class="p-3 text-right pr-4">
                        <span
                          class="px-2 py-1 bg-inset rounded-[2px] text-[11px] md:text-xs font-medium text-muted capitalize"
                        >
                          {{
                            (user.unit || "").replace(/_/g, " ").toLowerCase()
                          }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="paginatedUsers.length === 0">
                      <td
                        colspan="3"
                        class="p-6 text-center text-xs text-muted font-medium font-sans"
                      >
                        No users found matching "{{ searchQuery }}"
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                class="p-3 border-t border-rule bg-inset flex justify-between items-center"
              >
                <span
                  class="text-xs font-semibold text-status-info font-sans pl-1"
                >
                  {{ selectedUsers.length }} selected
                </span>

                <div v-if="totalPages > 1" class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="currentPage--"
                    :disabled="currentPage === 1"
                    aria-label="Previous page"
                    class="w-7 h-7 flex items-center justify-center rounded-md border border-rule bg-white hover:bg-inset disabled:opacity-50 transition-colors"
                  >
                    <Icon
                      name="material-symbols:chevron-left"
                      class="text-muted"
                    />
                  </button>
                  <span class="text-xs font-medium text-muted font-mono">
                    {{ currentPage }} / {{ totalPages }}
                  </span>
                  <button
                    type="button"
                    @click="currentPage++"
                    :disabled="currentPage === totalPages"
                    aria-label="Next page"
                    class="w-7 h-7 flex items-center justify-center rounded-md border border-rule bg-white hover:bg-inset disabled:opacity-50 transition-colors"
                  >
                    <Icon
                      name="material-symbols:chevron-right"
                      class="text-muted"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-muted font-sans"
                >Message title</label
              >
              <input
                v-model="payload.title"
                type="text"
                placeholder="e.g. Deployment Alert or Section A Full"
                required
                class="w-full border border-rule-strong mt-1 py-3 px-4 text-ink font-sans focus-visible:border-chapel text-xs md:text-xs"
              />
            </div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-muted font-sans"
                >Message body</label
              >
              <textarea
                v-model="payload.body"
                rows="4"
                placeholder="Type your message here..."
                required
                class="w-full border border-rule-strong text-xs md:text-sm py-3 px-4 text-ink font-sans resize-none focus-visible:border-chapel mt-1"
              ></textarea>
            </div>

            <div>
              <button
                type="submit"
                :disabled="isSubmitDisabled"
                class="w-full bg-chapel text-white font-semibold font-sans py-4 hover:bg-chapel-strong active:scale-[0.99] flex justify-center items-center gap-2 text-sm disabled:opacity-50 transition-colors"
              >
                {{ isSending ? "Sending…" : "Send message" }}
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
import { useAppToast } from "~/composables/useAppToast";

const toast = useAppToast();
const props = defineProps({
  defaultOpen: {
    type: Boolean,
    default: false,
  },
});
const isOpen = ref(props.defaultOpen);
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
  transition:
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  animation: fadeIn 180ms ease-out forwards;
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
