<template>
  <div class="flex flex-col gap-6 relative">
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
                      <th class="p-3 pl-4">User</th>
                      <th class="p-3">Full Name</th>
                      <th class="p-3">Email</th>
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
                      <td class="p-3 pl-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
                            @click="
                              openExpandedView(
                                user.avatar_url,
                                user.username,
                                user.first_name,
                              )
                            "
                          >
                            <img
                              v-if="user.avatar_url"
                              :src="user.avatar_url"
                              loading="lazy"
                              alt="Avatar"
                              class="w-full h-full object-cover"
                            />
                            <span
                              v-else
                              class="text-xs font-bold text-gray-400 uppercase"
                            >
                              {{
                                user.first_name?.charAt(0) ||
                                user.username?.charAt(0)
                              }}
                            </span>
                          </div>
                          <span
                            class="font-bold text-sm font-poppins text-black"
                          >
                            {{ user.username }}
                          </span>
                        </div>
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
                        <span class="font-bold text-sm font-poppins text-black">
                          {{ user.email }}
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
                    </tr>
                    <tr v-if="users.length === 0">
                      <td
                        colspan="6"
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

    <Teleport to="body">
      <div
        v-if="isEditModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      >
        <div
          class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div
            class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50"
          >
            <h3 class="text-lg font-black font-poppins text-black">
              Edit User
            </h3>
            <button
              @click="closeEditModal"
              class="p-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-5">
            <div class="space-y-1">
              <label
                class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                >Email*</label
              >
              <div class="relative">
                <input
                  v-model="editData.email"
                  @input="handleEditEmailCheck"
                  type="email"
                  required
                  class="w-full border rounded-md py-2.5 pl-3 pr-10 text-sm focus:border-black outline-none transition-colors"
                  :class="
                    emailStatus === 'taken' || emailStatus === 'invalid'
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-300'
                  "
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    v-if="emailStatus === 'checking'"
                    name="material-symbols:sync"
                    class="animate-spin text-gray-400 text-lg"
                  />
                  <Icon
                    v-else-if="emailStatus === 'available'"
                    name="material-symbols:check-circle"
                    class="text-green-500 text-lg"
                  />
                  <Icon
                    v-else-if="
                      emailStatus === 'taken' || emailStatus === 'invalid'
                    "
                    name="material-symbols:cancel"
                    class="text-red-500 text-lg"
                  />
                </div>
              </div>
              <p
                v-if="emailStatus === 'taken'"
                class="text-[10px] text-red-500 font-bold"
              >
                Email already in use.
              </p>
              <p
                v-if="emailStatus === 'invalid'"
                class="text-[10px] text-red-500 font-bold"
              >
                Invalid email syntax.
              </p>
            </div>

            <div class="space-y-1">
              <label
                class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                >Username*</label
              >
              <div class="relative">
                <input
                  v-model="editData.username"
                  @input="handleEditUsernameCheck"
                  type="text"
                  required
                  class="w-full border rounded-md py-2.5 pl-3 pr-10 text-sm focus:border-black outline-none transition-colors"
                  :class="
                    usernameStatus === 'taken'
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-300'
                  "
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    v-if="usernameStatus === 'checking'"
                    name="material-symbols:sync"
                    class="animate-spin text-gray-400 text-lg"
                  />
                  <Icon
                    v-else-if="usernameStatus === 'available'"
                    name="material-symbols:check-circle"
                    class="text-green-500 text-lg"
                  />
                  <Icon
                    v-else-if="usernameStatus === 'taken'"
                    name="material-symbols:cancel"
                    class="text-red-500 text-lg"
                  />
                </div>
              </div>
              <p
                v-if="usernameStatus === 'taken'"
                class="text-[10px] text-red-500 font-bold"
              >
                Username already taken.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label
                  class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                  >First Name</label
                >
                <input
                  v-model="editData.first_name"
                  type="text"
                  class="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-black outline-none"
                />
              </div>
              <div class="space-y-1">
                <label
                  class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                  >Last Name</label
                >
                <input
                  v-model="editData.last_name"
                  type="text"
                  class="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-black outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label
                  class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                  >Role*</label
                >
                <select
                  v-model="editData.role"
                  class="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-black outline-none bg-white"
                >
                  <option value="USHER">USHER</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>
              <div class="space-y-1">
                <label
                  class="text-[0.70rem] font-bold uppercase tracking-wider text-gray-400"
                  >Unit*</label
                >
                <select
                  v-model="editData.unit"
                  class="w-full border border-gray-300 rounded-md py-2.5 px-3 text-sm focus:border-black outline-none bg-white"
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
              </div>
            </div>
          </div>

          <div
            class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3"
          >
            <button
              @click="closeEditModal"
              class="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveEdit"
              :disabled="isSaving || isSaveDisabled"
              class="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Icon
                v-if="isSaving"
                name="material-symbols:sync"
                class="animate-spin text-lg"
              />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <AvatarViewerModal
      :is-open="isExpandedViewOpen"
      :image-url="expandedImageUrl"
      :fallback-initials="expandedFallbackInitials"
      @close="isExpandedViewOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";
import { useAdmin } from "~/composables/useAdmin";

const toast = useToast();
const confirmDialog = useConfirm();
const { checkAvailability } = useAdmin();

const isDirectoryOpen = ref(false);
const isLoading = ref(false);
const users = ref([]);
const pagination = ref({ page: 1, totalPages: 1, total: 0 });

const searchQuery = ref("");
const sortOrder = ref("desc");
let searchTimer = null;

// Modal & Editing State
const isEditModalOpen = ref(false);
const originalEditData = ref(null);
const editData = ref({
  id: "",
  email: "",
  username: "",
  first_name: "",
  last_name: "",
  role: "",
  unit: "",
});
const isSaving = ref(false);

// NEW: Viewer State
const isExpandedViewOpen = ref(false);
const expandedImageUrl = ref(null);
const expandedFallbackInitials = ref("");

const emailStatus = ref("idle");
const usernameStatus = ref("idle");
let emailTimer = null;
let usernameTimer = null;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isSaveDisabled = computed(() => {
  return (
    emailStatus.value === "checking" ||
    emailStatus.value === "taken" ||
    emailStatus.value === "invalid" ||
    emailStatus.value === "idle" ||
    usernameStatus.value === "checking" ||
    usernameStatus.value === "taken" ||
    !editData.value.email ||
    !editData.value.username
  );
});

// NEW: Viewer Logic
const openExpandedView = (url, username, firstName) => {
  expandedImageUrl.value = url;
  expandedFallbackInitials.value = firstName?.charAt(0) || username?.charAt(0);
  isExpandedViewOpen.value = true;
};

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
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchUsers(1);
  }, 400);
};

const toggleAccordion = () => {
  isDirectoryOpen.value = !isDirectoryOpen.value;
  if (isDirectoryOpen.value && users.value.length === 0) {
    fetchUsers(1);
  }
};

const startEditing = (user) => {
  originalEditData.value = { ...user };
  editData.value = {
    id: user.id,
    email: user.email || "",
    username: user.username || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role,
    unit: user.unit || "USHER",
  };

  emailStatus.value = editData.value.email ? "available" : "idle";
  usernameStatus.value = editData.value.username ? "available" : "idle";

  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  originalEditData.value = null;
};

const handleEditEmailCheck = () => {
  const val = editData.value.email.toLowerCase().trim();
  editData.value.email = val;
  clearTimeout(emailTimer);

  if (val === originalEditData.value.email) {
    emailStatus.value = "available";
    return;
  }

  if (val.length < 3) {
    emailStatus.value = "idle";
    return;
  }
  if (!emailRegex.test(val)) {
    emailStatus.value = "invalid";
    return;
  }

  emailStatus.value = "checking";
  emailTimer = setTimeout(async () => {
    const isAvailable = await checkAvailability("email", val);
    emailStatus.value = isAvailable ? "available" : "taken";
  }, 500);
};

const handleEditUsernameCheck = () => {
  const val = editData.value.username.trim();
  editData.value.username = val;
  clearTimeout(usernameTimer);

  if (val === originalEditData.value.username) {
    usernameStatus.value = "available";
    return;
  }

  if (val.length < 3) {
    usernameStatus.value = "idle";
    return;
  }

  usernameStatus.value = "checking";
  usernameTimer = setTimeout(async () => {
    const isAvailable = await checkAvailability("username", val);
    usernameStatus.value = isAvailable ? "available" : "taken";
  }, 500);
};

const saveEdit = async () => {
  isSaving.value = true;
  try {
    const updatedUser = await useApiFetch(`/users/${editData.value.id}`, {
      method: "PATCH",
      body: editData.value,
    });

    const index = users.value.findIndex((u) => u.id === editData.value.id);
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updatedUser };
    }
    toast.success("User updated successfully");
    closeEditModal();
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
  animation: fadeIn 0.2s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
/* Zoom-in animation for modal contents */
.animate-zoom-in {
  animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
