<template>
  <div class="flex flex-col gap-6 relative">
    <section
      class="bg-white rounded-none border border-rule transition-colors duration-200 overflow-hidden"
    >
      <button
        @click="toggleAccordion"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-inset transition-colors"
      >
        <h2 class="led-display text-[20px] flex items-center gap-2 m-0">
          User directory
        </h2>
        <div
          class="w-8 h-8 rounded-[2px] bg-inset flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isDirectoryOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-ink"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-if="isDirectoryOpen">
          <div class="px-6 pb-6 sm:px-8 sm:pb-8 pt-6 border-t border-rule mt-2">
            <div
              class="flex flex-col sm:flex-row gap-4 mb-6 pt-4 animate-fade-in"
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
                  @input="handleSearch"
                  type="text"
                  placeholder="Search username or name..."
                  class="w-full pl-10 pr-4 py-2 border border-rule-strong text-xs md:text-sm font-sans transition-colors focus-visible:border-chapel"
                />
              </div>
              <select
                v-model="sortOrder"
                @change="fetchUsers(1)"
                class="border border-rule-strong px-4 py-2 text-xs md:text-sm font-sans bg-white focus-visible:border-chapel cursor-pointer"
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
                class="animate-spin text-3xl text-muted"
              />
            </div>

            <div v-else class="animate-fade-in">
              <p class="mb-3 text-xs text-muted sm:hidden">
                Swipe sideways to see all columns.
              </p>
              <div
                class="cv-auto overflow-x-auto border border-rule rounded-none"
              >
                <table
                  class="w-full min-w-[760px] text-left border-collapse whitespace-nowrap"
                >
                  <thead>
                    <tr
                      class="bg-inset border-b border-rule text-xs font-semibold text-muted font-sans"
                    >
                      <th class="p-3 pl-4">User</th>
                      <th class="p-3">Full Name</th>
                      <th class="p-3">Email</th>
                      <th class="p-3">Role</th>
                      <th class="p-3">Unit</th>
                      <th
                        class="p-3 pr-4 text-right sticky right-0 z-10 bg-inset border-l border-rule shadow-[-10px_0_16px_-14px_rgba(0,0,0,0.45)]"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-rule">
                    <tr
                      v-for="user in users"
                      :key="user.id"
                      class="group hover:bg-inset/50 transition-colors"
                    >
                      <td class="p-3 pl-4">
                        <div class="flex items-center gap-3">
                          <button
                            type="button"
                            class="w-8 h-8 rounded-[2px] border border-rule bg-inset flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-colors"
                            :aria-label="`View ${user.username}'s profile picture`"
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
                              class="text-xs font-semibold text-muted"
                            >
                              {{
                                user.first_name?.charAt(0) ||
                                user.username?.charAt(0)
                              }}
                            </span>
                          </button>
                          <span
                            class="font-semibold text-xs md:text-sm font-sans text-ink"
                          >
                            {{ user.username }}
                          </span>
                        </div>
                      </td>
                      <td class="p-3">
                        <span class="text-xs text-muted font-medium">
                          {{
                            user.first_name || user.last_name
                              ? `${user.first_name || ""} ${user.last_name || ""}`
                              : "--"
                          }}
                        </span>
                      </td>
                      <td class="p-3">
                        <span
                          class="font-semibold text-xs md:text-sm font-sans text-ink"
                        >
                          {{ user.email }}
                        </span>
                      </td>
                      <td class="p-3">
                        <span
                          class="px-2 py-0.5 rounded-[2px] text-xs font-semibold capitalize"
                          :class="
                            user.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-inset text-muted border border-rule'
                          "
                        >
                          {{ user.role.replace("_", " ").toLowerCase() }}
                        </span>
                      </td>
                      <td class="p-3">
                        <span
                          class="text-xs font-medium text-muted capitalize bg-inset px-2 py-1 rounded-[2px] border border-rule"
                        >
                          {{
                            user.unit
                              ? user.unit.replace("_", " ").toLowerCase()
                              : "usher"
                          }}
                        </span>
                      </td>
                      <td
                        class="p-3 pr-4 text-right sticky right-0 bg-white group-hover:bg-inset border-l border-rule shadow-[-10px_0_16px_-14px_rgba(0,0,0,0.35)]"
                      >
                        <div class="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            @click="startEditing(user)"
                            class="p-1.5 text-status-info hover:bg-inset transition-colors"
                            title="Edit"
                            :aria-label="`Edit ${user.username}`"
                          >
                            <Icon
                              name="material-symbols:edit-square-outline"
                              class="text-lg"
                            />
                          </button>
                          <button
                            type="button"
                            @click="deleteUser(user.id, user.username)"
                            class="p-1.5 text-status-error hover:bg-[#fdf0ef] transition-colors"
                            title="Delete"
                            :aria-label="`Delete ${user.username}`"
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
                        class="p-6 text-center text-xs text-muted"
                      >
                        No users found matching your criteria.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="pagination.totalPages > 1"
                class="mt-4 flex justify-between items-center bg-inset p-2 rounded-none border border-rule"
              >
                <button
                  type="button"
                  @click="fetchUsers(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  aria-label="Previous page"
                  class="w-8 h-8 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <Icon
                    name="material-symbols:chevron-left"
                    class="text-lg text-ink"
                  />
                </button>
                <span class="text-xs font-medium text-muted font-sans">
                  Page
                  <span class="text-ink font-mono">{{ pagination.page }}</span>
                  of
                  <span class="text-ink font-mono">{{
                    pagination.totalPages || 1
                  }}</span>
                </span>
                <button
                  type="button"
                  @click="fetchUsers(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  aria-label="Next page"
                  class="w-8 h-8 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <Icon
                    name="material-symbols:chevron-right"
                    class="text-lg text-ink"
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
        class="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="closeEditModal"
      >
        <div
          ref="editModalRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          tabindex="-1"
          class="bg-white rounded-none w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div
            class="px-6 py-4 border-b border-rule flex justify-between items-center bg-inset"
          >
            <h3
              id="edit-user-title"
              class="text-lg font-bold font-sans text-ink"
            >
              Edit user
            </h3>
            <button
              type="button"
              @click="closeEditModal"
              aria-label="Close edit user dialog"
              class="p-1 text-muted hover:text-ink hover:bg-inset rounded-[2px] transition-colors"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-5">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted">Email</label>
              <div class="relative">
                <input
                  v-model="editData.email"
                  @input="handleEditEmailCheck"
                  type="email"
                  required
                  class="w-full border border-rule-strong py-2.5 pl-3 pr-10 text-xs md:text-sm transition-colors focus-visible:border-chapel"
                  :class="
                    emailStatus === 'taken' || emailStatus === 'invalid'
                      ? 'border-status-error bg-[#fdf0ef]/30'
                      : 'border-rule-strong'
                  "
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    v-if="emailStatus === 'checking'"
                    name="material-symbols:sync"
                    class="animate-spin text-muted text-lg"
                  />
                  <Icon
                    v-else-if="emailStatus === 'available'"
                    name="material-symbols:check-circle"
                    class="text-status-success text-lg"
                  />
                  <Icon
                    v-else-if="
                      emailStatus === 'taken' || emailStatus === 'invalid'
                    "
                    name="material-symbols:cancel"
                    class="text-status-error text-lg"
                  />
                </div>
              </div>
              <p
                v-if="emailStatus === 'taken'"
                class="text-xs font-medium text-status-error"
              >
                Email already in use.
              </p>
              <p
                v-if="emailStatus === 'invalid'"
                class="text-xs font-medium text-status-error"
              >
                Invalid email syntax.
              </p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-muted">Username</label>
              <div class="relative">
                <input
                  v-model="editData.username"
                  @input="handleEditUsernameCheck"
                  type="text"
                  required
                  class="w-full border border-rule-strong py-2.5 pl-3 pr-10 text-xs md:text-sm transition-colors focus-visible:border-chapel"
                  :class="
                    usernameStatus === 'taken'
                      ? 'border-status-error bg-[#fdf0ef]/30'
                      : 'border-rule-strong'
                  "
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <Icon
                    v-if="usernameStatus === 'checking'"
                    name="material-symbols:sync"
                    class="animate-spin text-muted text-lg"
                  />
                  <Icon
                    v-else-if="usernameStatus === 'available'"
                    name="material-symbols:check-circle"
                    class="text-status-success text-lg"
                  />
                  <Icon
                    v-else-if="usernameStatus === 'taken'"
                    name="material-symbols:cancel"
                    class="text-status-error text-lg"
                  />
                </div>
              </div>
              <p
                v-if="usernameStatus === 'taken'"
                class="text-xs font-medium text-status-error"
              >
                Username already taken.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted"
                  >First name</label
                >
                <input
                  v-model="editData.first_name"
                  type="text"
                  class="w-full border border-rule-strong py-2.5 px-3 text-xs md:text-sm focus-visible:border-chapel"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted"
                  >Last name</label
                >
                <input
                  v-model="editData.last_name"
                  type="text"
                  class="w-full border border-rule-strong py-2.5 px-3 text-xs md:text-sm focus-visible:border-chapel"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted">Role</label>
                <select
                  v-model="editData.role"
                  class="w-full border border-rule-strong py-2.5 px-3 text-xs md:text-sm focus-visible:border-chapel bg-white"
                >
                  <option value="USHER">USHER</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold text-muted">Unit</label>
                <select
                  v-model="editData.unit"
                  class="w-full border border-rule-strong py-2.5 px-3 text-xs md:text-sm focus-visible:border-chapel bg-white"
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

          <div class="p-6 border-t border-rule bg-inset flex justify-end gap-3">
            <button
              @click="closeEditModal"
              class="px-5 py-2.5 text-xs font-semibold text-muted hover:bg-inset transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveEdit"
              :disabled="isSaving || isSaveDisabled"
              class="px-6 py-2.5 text-xs md:text-sm font-semibold bg-chapel text-white hover:bg-chapel-strong transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Icon
                v-if="isSaving"
                name="material-symbols:sync"
                class="animate-spin text-lg"
              />
              {{ isSaving ? "Saving" : "Save" }}
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
import { ref, computed, onMounted } from "vue";
import { useAppToast } from "~/composables/useAppToast";
import { useConfirm } from "~/composables/useConfirm";
import { useAdmin } from "~/composables/useAdmin";
import { useModalA11y } from "~/composables/useModalA11y";

const props = defineProps({
  defaultOpen: {
    type: Boolean,
    default: false,
  },
});

const toast = useAppToast();
const confirmDialog = useConfirm();
const { checkAvailability } = useAdmin();

const isDirectoryOpen = ref(props.defaultOpen);
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

const editModalRef = ref(null);

const closeEditModal = () => {
  isEditModalOpen.value = false;
  originalEditData.value = null;
};

useModalA11y(isEditModalOpen, editModalRef, {
  onClose: closeEditModal,
  initialFocusSelector: "input",
});

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

onMounted(() => {
  if (isDirectoryOpen.value) fetchUsers(1);
});
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  animation: fadeIn 180ms ease-out forwards;
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
