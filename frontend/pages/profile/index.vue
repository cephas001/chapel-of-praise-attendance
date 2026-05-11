<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24 relative">
    <main class="pt-8 p-6 lg:px-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header
        class="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1
            class="text-4xl sm:text-5xl font-black tracking-tighter text-black mb-2 uppercase font-montserrat"
          >
            My Profile
          </h1>
          <p class="text-gray-500 font-poppins tracking-wide">
            Manage your identity and local settings.
          </p>
        </div>
      </header>

      <section
        class="bg-gray-50 rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-gray-200 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden"
      >
        <div
          class="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-0"
        ></div>

        <div class="relative z-10 shrink-0">
          <div
            class="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer"
            @click="handleAvatarClick"
          >
            <img
              v-if="avatarPreview || user?.avatar_url"
              :src="avatarPreview || user?.avatar_url"
              alt="Profile"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <span
              v-else
              class="text-3xl font-black text-gray-300 font-montserrat uppercase"
            >
              {{ user?.first_name?.charAt(0) || user?.username?.charAt(0) }}
            </span>

            <div
              class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon
                name="material-symbols:photo-camera"
                class="text-white text-2xl"
              />
            </div>

            <div
              v-if="isUploading"
              class="absolute inset-0 bg-white/80 flex items-center justify-center"
            >
              <Icon
                name="material-symbols:sync"
                class="text-black text-3xl animate-spin"
              />
            </div>
          </div>

          <input
            type="file"
            ref="fileInput"
            accept="image/jpeg, image/png, image/webp"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>

        <div class="text-center sm:text-left z-10 flex-grow">
          <div
            class="flex flex-wrap justify-center sm:justify-start gap-2 mb-3"
          >
            <span
              class="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center"
            >
              {{ user?.unit?.replace("_", " ") || "UNIT" }}
            </span>
          </div>

          <h2
            class="text-xl font-black font-montserrat text-black uppercase"
            v-if="user?.first_name"
          >
            {{ user?.first_name }} {{ user?.last_name }}
          </h2>
          <p class="text-sm text-black font-semibold font-poppins mt-1">
            @{{ user?.username }}
          </p>
          <p class="text-xs text-gray-600 font-poppins mt-1">
            {{ user?.email }}
          </p>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-4">
        <div
          class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <Icon
            name="material-symbols:qr-code-scanner"
            class="text-gray-300 text-3xl mb-4"
          />
          <div>
            <p class="text-3xl font-black font-montserrat text-black">
              {{ localStats.totalScans }}
            </p>
            <p
              class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1"
            >
              Lifetime Scans
            </p>
          </div>
        </div>

        <div
          class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden"
        >
          <div
            class="absolute right-0 top-0 w-16 h-16 bg-red-50 rounded-bl-full"
          ></div>
          <div class="flex justify-between items-start relative z-10">
            <Icon
              name="material-symbols:database"
              class="text-red-300 text-3xl mb-4"
            />
            <button
              v-if="localStats.unsynced > 0"
              @click="$router.push('/scanner')"
              class="px-3 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-200 transition-colors"
            >
              Sync Now
            </button>
          </div>
          <div class="relative z-10">
            <p class="text-3xl font-black font-montserrat text-red-600">
              {{ localStats.unsynced }}
            </p>
            <p
              class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1"
            >
              Unsynced
            </p>
          </div>
        </div>
      </section>

      <section
        class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div class="p-6 sm:p-8 border-b border-gray-50">
          <h3
            class="text-sm font-bold uppercase tracking-widest font-montserrat text-black"
          >
            Security
          </h3>
        </div>

        <div class="pt-3 pb-6 px-6 sm:p-8 space-y-6">
          <button
            @click="isPasswordModalOpen = true"
            class="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black"
              >
                <Icon name="material-symbols:lock-reset" class="text-xl" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold text-black font-poppins">
                  Change Password
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Update your security credentials
                </p>
              </div>
            </div>
            <Icon
              name="material-symbols:chevron-right"
              class="text-gray-400 group-hover:text-black transition-colors text-xl"
            />
          </button>

          <button
            @click="handleLogout"
            class="w-full flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors group"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <Icon name="material-symbols:logout" class="text-xl" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold font-poppins">Sign Out</p>
                <p class="text-xs mt-0.5">Clear local session data</p>
              </div>
            </div>
          </button>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div
        v-if="isActionMenuOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="isActionMenuOpen = false"
      >
        <div
          class="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in"
        >
          <div
            class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50"
          >
            <h3 class="text-lg font-black font-poppins text-black">
              Profile Picture
            </h3>
            <button
              @click="isActionMenuOpen = false"
              class="p-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <div class="p-6 space-y-3">
            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              @click="openExpandedView"
            >
              <div
                class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black"
              >
                <Icon name="material-symbols:visibility" class="text-xl" />
              </div>
              <div>
                <p class="text-sm font-bold text-black font-poppins">
                  View Picture
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  See your profile photo in full size.
                </p>
              </div>
            </button>

            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              @click="triggerFileInput"
            >
              <div
                class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-black"
              >
                <Icon name="material-symbols:edit" class="text-xl" />
              </div>
              <div>
                <p class="text-sm font-bold text-black font-poppins">
                  Change Picture
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Proceed to upload a new one.
                </p>
              </div>
            </button>

            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
              @click="handleRemoveAvatar"
            >
              <div
                class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"
              >
                <Icon name="material-symbols:delete" class="text-xl" />
              </div>
              <div>
                <p class="text-sm font-bold text-black font-poppins">
                  Remove Picture
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Delete your profile picture.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <AvatarViewerModal
      :isOpen="isExpandedViewOpen"
      :imageUrl="avatarPreview || user?.avatar_url"
      :fallbackInitials="
        user?.first_name?.charAt(0) || user?.username?.charAt(0)
      "
      @close="isExpandedViewOpen = false"
    />

    <Teleport to="body">
      <div
        v-if="isPasswordModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        @click.self="closePasswordModal"
      >
        <div
          class="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-zoom-in"
        >
          <div
            class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50"
          >
            <h3 class="text-lg font-black font-poppins text-black">
              Change Password
            </h3>
            <button
              @click="closePasswordModal"
              class="p-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <form @submit.prevent="submitPasswordChange" class="p-6 space-y-4">
            <div class="space-y-1">
              <label
                class="text-[0.70rem] font-bold uppercase tracking-wider text-black"
                >Current Password</label
              >
              <div class="relative group">
                <input
                  v-model="passwordData.current"
                  :type="showPassword.current ? 'text' : 'password'"
                  required
                  class="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-10 text-sm focus:border-black outline-none transition-colors text-black"
                  :class="{ 'border-red-500 bg-red-50/30': passwordError }"
                />
                <button
                  type="button"
                  @click="showPassword.current = !showPassword.current"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black outline-none"
                >
                  <Icon
                    :name="
                      showPassword.current
                        ? 'material-symbols:visibility-off'
                        : 'material-symbols:visibility'
                    "
                    class="text-lg"
                  />
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label
                class="text-[0.70rem] font-bold uppercase tracking-wider text-black"
                >New Password</label
              >
              <div class="relative group">
                <input
                  v-model="passwordData.new"
                  :type="showPassword.new ? 'text' : 'password'"
                  required
                  minlength="6"
                  class="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-10 text-sm focus:border-black outline-none transition-colors text-black"
                />
                <button
                  type="button"
                  @click="showPassword.new = !showPassword.new"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black outline-none"
                >
                  <Icon
                    :name="
                      showPassword.new
                        ? 'material-symbols:visibility-off'
                        : 'material-symbols:visibility'
                    "
                    class="text-lg"
                  />
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <label
                class="text-[0.70rem] font-bold uppercase tracking-wider text-black"
                >Confirm New Password</label
              >
              <div class="relative group">
                <input
                  v-model="passwordData.confirm"
                  :type="showPassword.confirm ? 'text' : 'password'"
                  required
                  class="w-full border border-gray-300 rounded-md py-2.5 pl-3 pr-10 text-sm focus:border-black outline-none transition-colors text-black"
                />
                <button
                  type="button"
                  @click="showPassword.confirm = !showPassword.confirm"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black outline-none"
                >
                  <Icon
                    :name="
                      showPassword.confirm
                        ? 'material-symbols:visibility-off'
                        : 'material-symbols:visibility'
                    "
                    class="text-lg"
                  />
                </button>
              </div>
            </div>

            <div
              v-if="passwordError"
              class="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-fade-in"
            >
              <Icon
                name="material-symbols:error"
                class="text-red-500 text-lg shrink-0"
              />
              <p class="text-xs text-red-600 font-medium mt-0.5">
                {{ passwordError }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="isChangingPassword"
              class="w-full mt-2 bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-all uppercase tracking-widest text-xs flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <Icon
                v-if="isChangingPassword"
                name="material-symbols:sync"
                class="animate-spin text-lg"
              />
              Update Password
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useToast } from "~/composables/useToast";
import { useConfirm } from "~/composables/useConfirm";
import { db } from "~/utils/db"; // Assuming this handles your indexedDB logic

const confirm = useConfirm();
const router = useRouter();
const { user, logout } = useAuth();
const toast = useToast();

console.log(user.value);

// --- NEW PASSWORD STATE ---
const isPasswordModalOpen = ref(false);
const isChangingPassword = ref(false);
const passwordError = ref("");
const passwordData = ref({
  current: "",
  new: "",
  confirm: "",
});

// Added state for toggling visibility independently on each field
const showPassword = ref({
  current: false,
  new: false,
  confirm: false,
});

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  passwordError.value = "";
  passwordData.value = { current: "", new: "", confirm: "" };
  // Reset visibility states when closing the modal
  showPassword.value = { current: false, new: false, confirm: false };
};

const submitPasswordChange = async () => {
  passwordError.value = "";

  if (passwordData.value.new !== passwordData.value.confirm) {
    passwordError.value = "New passwords do not match.";
    return;
  }

  isChangingPassword.value = true;

  try {
    const response = await useApiFetch("/users/profile/password", {
      method: "PATCH",
      body: {
        currentPassword: passwordData.value.current,
        newPassword: passwordData.value.new,
      },
    });

    if (response.success) {
      toast.success("Password updated successfully!");
      closePasswordModal();
    }
  } catch (error) {
    passwordError.value =
      error.data?.error || "Failed to update password. Please try again.";
  } finally {
    isChangingPassword.value = false;
  }
};

const fileInput = ref(null);
const avatarPreview = ref(null);
const isUploading = ref(false);

const isActionMenuOpen = ref(false);
const isExpandedViewOpen = ref(false);

const localStats = ref({
  totalScans: 0,
  unsynced: 0,
});

const handleAvatarClick = () => {
  if (!user.value?.avatar_url && !avatarPreview.value) {
    triggerFileInput();
  } else {
    isActionMenuOpen.value = true;
  }
};

const triggerFileInput = () => {
  if (isUploading.value) return;
  isActionMenuOpen.value = false;
  fileInput.value.click();
};

const openExpandedView = () => {
  isActionMenuOpen.value = false;
  isExpandedViewOpen.value = true;
};

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image too large. Please select a file under 5MB.");
    return;
  }

  avatarPreview.value = URL.createObjectURL(file);
  const formData = new FormData();
  formData.append("avatar", file);
  isUploading.value = true;

  try {
    const response = await useApiFetch("/users/profile/avatar", {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      user.value.avatar_url = response.user.avatar_url;
      toast.success("Profile picture updated!");
    }
  } catch (error) {
    console.error(error);
    avatarPreview.value = null;
    toast.error("Failed to upload image. Please check your connection.");
  } finally {
    isUploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const handleRemoveAvatar = async () => {
  isActionMenuOpen.value = false;

  if (!user.value?.avatar_url && !avatarPreview.value) {
    toast.info("You don't have a profile picture to remove.");
    return;
  }

  const isConfirmed = await confirm.ask({
    title: "Remove Profile Picture?",
    message:
      "Are you sure you want to remove your picture? This action cannot be undone.",
    confirmText: "Yes, Remove",
    cancelText: "Cancel",
    isDestructive: true,
  });

  if (!isConfirmed) return;

  try {
    const response = await useApiFetch("/users/profile/avatar", {
      method: "DELETE",
    });

    if (response.success) {
      user.value.avatar_url = null;
      avatarPreview.value = null;
      toast.success("Profile picture removed successfully.");
    }
  } catch (error) {
    toast.error(error.data?.error || "Failed to remove profile picture.");
  }
};

const handleLogout = async () => {
  const isConfirmed = await confirm.ask({
    title: "Logout Confirmation",
    message:
      "Are you sure you want to logout? This will clear your local session data.",
    confirmText: "Yes, Logout",
    cancelText: "Cancel",
    isDestructive: true,
  });

  if (isConfirmed) logout();

  router.push("/login");
};

onMounted(async () => {
  try {
    if (db?.unsynced_scans) {
      const count = await db.unsynced_scans.count();
      localStats.value.unsynced = count || 0;
    }
  } catch (e) {
    console.error("Failed to read IndexedDB queue length:", e);
    localStats.value.unsynced = 0;
  }

  try {
    const stats = await useApiFetch("/users/profile/stats");
    if (stats && stats.totalScans !== undefined) {
      localStats.value.totalScans = stats.totalScans;
    }
  } catch (error) {
    console.error("Failed to fetch lifetime stats", error);
  }
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
