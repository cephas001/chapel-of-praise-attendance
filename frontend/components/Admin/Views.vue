<template>
  <div class="flex flex-col gap-6">
    <section
      class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
    >
      <button
        @click="toggleAccordion"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <h2 class="text-md font-black font-poppins flex items-center gap-2 m-0">
          <Icon name="material-symbols:group" class="text-md text-black" />
          User Directory
        </h2>
        <div
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isDirectoryOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-black"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-show="isDirectoryOpen">
          <div
            class="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-gray-100 mt-2"
          >
            <div
              class="flex flex-col sm:flex-row gap-4 mb-6 pt-4 animate-fade-in"
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
                  @input="handleSearch"
                  type="text"
                  placeholder="Search username or name..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-poppins focus:border-black outline-none transition-colors"
                />
              </div>
              <select
                v-model="sortOrder"
                @change="fetchUsers(1)"
                class="border border-gray-300 rounded-lg px-4 py-2 text-sm font-poppins bg-white focus:border-black outline-none cursor-pointer"
              >
                <option value="desc">Newest First</option>
                <option value="asc">A-Z (Username)</option>
                <option value="desc_alpha">Z-A (Username)</option>
              </select>
            </div>

            <div
              v-if="isLoading"
              class="py-12 flex justify-center items-center"
            >
              <Icon
                name="material-symbols:sync"
                class="animate-spin text-3xl text-gray-300"
              />
            </div>

            <div v-else class="animate-fade-in">
              <div class="overflow-x-auto border border-gray-200 rounded-xl">
                <table
                  class="w-full text-left border-collapse whitespace-nowrap"
                >
                  <thead>
                    <tr
                      class="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-widest font-bold text-gray-500 font-poppins"
                    >
                      <th class="p-3 pl-4">Username</th>
                      <th class="p-3">Full Name</th>
                      <th class="p-3">Role</th>
                      <th class="p-3">Unit</th>
                      <th class="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="user in users"
                      :key="user.id"
                      class="hover:bg-gray-50/50 transition-colors"
                    >
                      <template v-if="editingUserId !== user.id">
                        <td class="p-3 pl-4">
                          <span
                            class="font-bold text-sm font-poppins text-black"
                            >{{ user.username }}</span
                          >
                        </td>
                        <td class="p-3">
                          <span class="text-xs text-gray-600 font-medium">
                            {{
                              user.first_name || user.last_name
                                ? `${user.first_name || ""} ${user.last_name || ""}`
                                : "--"
                            }}
                          </span>
                        </td>
                        <td class="p-3">
                          <span
                            class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                            :class="
                              user.role === 'SUPER_ADMIN'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            "
                          >
                            {{ user.role.replace("_", " ") }}
                          </span>
                        </td>
                        <td class="p-3">
                          <span
                            class="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded border border-gray-200"
                          >
                            {{
                              user.unit ? user.unit.replace("_", " ") : "USHER"
                            }}
                          </span>
                        </td>
                        <td class="p-3 pr-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              @click="startEditing(user)"
                              class="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Icon
                                name="material-symbols:edit-square-outline"
                                class="text-lg"
                              />
                            </button>
                            <button
                              @click="deleteUser(user.id, user.username)"
                              class="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Icon
                                name="material-symbols:delete-outline"
                                class="text-lg"
                              />
                            </button>
                          </div>
                        </td>
                      </template>

                      <template v-else>
                        <td class="p-3 pl-4">
                          <span
                            class="font-bold text-sm font-poppins text-gray-400"
                            >{{ user.username }}</span
                          >
                        </td>
                        <td class="p-3 flex gap-2">
                          <input
                            v-model="editData.first_name"
                            type="text"
                            placeholder="First"
                            class="w-24 border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-black"
                          />
                          <input
                            v-model="editData.last_name"
                            type="text"
                            placeholder="Last"
                            class="w-24 border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-black"
                          />
                        </td>
                        <td class="p-3">
                          <select
                            v-model="editData.role"
                            class="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-black bg-white"
                          >
                            <option value="USHER">USHER</option>
                            <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          </select>
                        </td>
                        <td class="p-3">
                          <select
                            v-model="editData.unit"
                            class="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-black bg-white"
                          >
                            <option value="USHER">USHER</option>
                            <option value="DRAMA">DRAMA</option>
                            <option value="MEDIA">MEDIA</option>
                            <option value="CHOIR">CHOIR</option>
                            <option value="TECHNICAL">TECHNICAL</option>
                            <option value="ACADEMIC">ACADEMIC</option>
                            <option value="BIBLE_STUDY">BIBLE STUDY</option>
                            <option value="BROTHERS">BROTHERS</option>
                            <option value="EVANGELISM">EVANGELISM</option>
                            <option value="PRAYER">PRAYER</option>
                            <option value="PROTOCOL">PROTOCOL</option>
                            <option value="SISTERS">SISTERS</option>
                            <option value="WELFARE">WELFARE</option>
                            <option value="EDITORIAL">EDITORIAL</option>
                            <option value="OTHER">OTHER</option>
                          </select>
                        </td>
                        <td class="p-3 pr-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <button
                              @click="saveEdit(user.id)"
                              :disabled="isSaving"
                              class="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Save"
                            >
                              <Icon
                                v-if="isSaving"
                                name="material-symbols:sync"
                                class="text-lg animate-spin"
                              />
                              <Icon
                                v-else
                                name="material-symbols:check-circle"
                                class="text-lg"
                              />
                            </button>
                            <button
                              @click="cancelEdit"
                              :disabled="isSaving"
                              class="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <Icon
                                name="material-symbols:cancel"
                                class="text-lg"
                              />
                            </button>
                          </div>
                        </td>
                      </template>
                    </tr>
                    <tr v-if="users.length === 0">
                      <td
                        colspan="5"
                        class="p-6 text-center text-xs text-gray-500"
                      >
                        No users found matching your criteria.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="pagination.totalPages > 1"
                class="mt-4 flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200"
              >
                <button
                  @click="fetchUsers(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
                >
                  <Icon
                    name="material-symbols:chevron-left"
                    class="text-lg text-black"
                  />
                </button>
                <span
                  class="text-[11px] font-bold uppercase tracking-widest text-gray-500 font-poppins"
                >
                  Page <span class="text-black">{{ pagination.page }}</span> of
                  <span class="text-black">{{
                    pagination.totalPages || 1
                  }}</span>
                </span>
                <button
                  @click="fetchUsers(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 transition-all"
                >
                  <Icon
                    name="material-symbols:chevron-right"
                    class="text-lg text-black"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";

const toast = useToast();
const confirmDialog = useConfirm();

const isDirectoryOpen = ref(false);
const isLoading = ref(false);
const users = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0 });

const searchQuery = ref("");
const sortOrder = ref("desc");
let typingTimer = null;

// Inline Editing State
const editingUserId = ref(null);
const editData = ref({ first_name: "", last_name: "", role: "", unit: "" });
const isSaving = ref(false);

const fetchUsers = async (page = 1) => {
  isLoading.value = true;
  try {
    const data = await useApiFetch(
      `/users?page=${page}&limit=10&search=${searchQuery.value}&sort=${sortOrder.value}`,
    );
    users.value = data.users;
    pagination.value = data.pagination;
  } catch (error) {
    console.error("Failed to fetch users", error);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    fetchUsers(1);
  }, 400);
};

const toggleAccordion = () => {
  isDirectoryOpen.value = !isDirectoryOpen.value;
  if (isDirectoryOpen.value && users.value.length === 0) {
    fetchUsers(1);
  }
};

// --- ACTION LOGIC ---

const startEditing = (user) => {
  editingUserId.value = user.id;
  editData.value = {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role,
    unit: user.unit || "USHER", // Default fallback if empty
  };
};

const cancelEdit = () => {
  editingUserId.value = null;
};

const saveEdit = async (id) => {
  isSaving.value = true;
  try {
    const updatedUser = await useApiFetch(`/users/${id}`, {
      method: "PATCH",
      body: editData.value,
    });

    const index = users.value.findIndex((u) => u.id === id);
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updatedUser };
    }
    toast.success("User updated successfully");
    editingUserId.value = null;
  } catch (error) {
    toast.error(error.data?.error || "Failed to update user.");
  } finally {
    isSaving.value = false;
  }
};

const deleteUser = async (id, username) => {
  const isConfirmed = await confirmDialog.ask({
    title: "Delete User?",
    message: `Are you sure you want to permanently delete the user "${username}"?`,
    confirmText: "Yes, Delete",
    cancelText: "Cancel",
    isDestructive: true,
  });

  if (!isConfirmed) return;

  try {
    await useApiFetch(`/users/${id}`, { method: "DELETE" });
    users.value = users.value.filter((u) => u.id !== id);
    toast.success("User deleted successfully");
  } catch (error) {
    toast.error(error.data?.error || "Failed to delete user.");
  }
};
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px;
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
