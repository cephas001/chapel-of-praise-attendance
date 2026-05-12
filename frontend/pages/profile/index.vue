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
        class="bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col"
      >
        <div class="h-24 sm:h-32 bg-black relative overflow-hidden">
          <div
            class="absolute -top-24 -right-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"
          ></div>
        </div>

        <div class="px-6 pb-6 sm:px-8 sm:pb-8 relative">
          <div
            class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4 sm:mb-2"
          >
            <div class="relative z-10 shrink-0 flex justify-center sm:block">
              <div class="relative inline-block">
                <div
                  class="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
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
                    {{
                      user?.first_name?.charAt(0) || user?.username?.charAt(0)
                    }}
                  </span>

                  <div
                    class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                  >
                    <Icon
                      name="material-symbols:photo-camera"
                      class="text-white text-2xl"
                    />
                  </div>

                  <div
                    v-if="isUploading"
                    class="absolute inset-0 bg-white/80 flex items-center justify-center z-30"
                  >
                    <Icon
                      name="material-symbols:sync"
                      class="text-black text-3xl animate-spin"
                    />
                  </div>
                </div>

                <button
                  @click="handleAvatarClick"
                  class="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center text-black hover:bg-gray-50 hover:scale-105 transition-all z-20"
                  title="Change Profile Picture"
                >
                  <Icon
                    name="material-symbols:photo-camera"
                    class="text-sm sm:text-base"
                  />
                </button>
              </div>

              <input
                type="file"
                ref="fileInput"
                accept="image/jpeg, image/png, image/webp"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>

            <div class="flex justify-center sm:justify-end pb-1">
              <span
                class="px-4 py-1.5 bg-gray-50 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5"
              >
                <Icon
                  name="material-symbols:shield-person"
                  class="text-sm text-gray-400"
                />
                {{ user?.unit?.replace("_", " ") || "UNIT" }}
              </span>
            </div>
          </div>

          <div class="text-center sm:text-left z-10 mt-2">
            <h2
              class="text-2xl sm:text-3xl font-black font-montserrat text-black uppercase tracking-tight"
              v-if="user?.first_name"
            >
              {{ user?.first_name }} {{ user?.last_name }}
            </h2>

            <div
              class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5"
            >
              <p class="text-sm font-bold text-gray-900 font-poppins">
                @{{ user?.username }}
              </p>
              <span class="hidden sm:block text-gray-300">•</span>
              <p
                class="text-sm text-gray-500 font-poppins flex items-center justify-center sm:justify-start gap-1.5 mt-0.5 sm:mt-0"
              >
                <Icon name="material-symbols:mail-outline" class="text-base" />
                {{ user?.email }}
              </p>
            </div>
          </div>
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
              Total Scans
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
                class="w-10 h-10 rounded-full flex items-center justify-center bg-red-50"
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

    <LazyAvatarCropperModal
      v-if="rawImageUrl"
      :isOpen="isCropperOpen"
      :imageUrl="rawImageUrl"
      @close="closeCropper"
      @crop="handleCroppedImage"
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
import { db } from "~/utils/db";

const confirm = useConfirm();
const router = useRouter();
const { user, logout } = useAuth();
const toast = useToast();

const isPasswordModalOpen = ref(false);
const isChangingPassword = ref(false);
const passwordError = ref("");
const passwordData = ref({
  current: "",
  new: "",
  confirm: "",
});

const showPassword = ref({
  current: false,
  new: false,
  confirm: false,
});

const closePasswordModal = () => {
  isPasswordModalOpen.value = false;
  passwordError.value = "";
  passwordData.value = { current: "", new: "", confirm: "" };
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

// --- NEW CROPPER STATE ---
const isCropperOpen = ref(false);
const rawImageUrl = ref(null);

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

// 1. Intercept file selection and open the cropper
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image too large. Please select a file under 5MB.");
    return;
  }

  // Create a URL for the raw, uncropped image and pass it to the cropper modal
  rawImageUrl.value = URL.createObjectURL(file);
  isCropperOpen.value = true;

  // Clear the input so the same file can be selected again if needed
  if (fileInput.value) fileInput.value.value = "";
};

const closeCropper = () => {
  isCropperOpen.value = false;
  rawImageUrl.value = null;
};

// 2. Receive the cropped blob and upload it
const handleCroppedImage = async (blob) => {
  closeCropper(); // Close the modal immediately

  // Create an instant preview of the cropped result
  avatarPreview.value = URL.createObjectURL(blob);

  const formData = new FormData();
  // Append the blob, providing a generic filename so multer picks it up
  formData.append("avatar", blob, "avatar.jpg");

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
