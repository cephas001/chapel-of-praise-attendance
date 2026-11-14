<template>
  <div class="relative min-h-screen bg-canvas pb-24 font-sans text-ink">
    <main class="mx-auto max-w-5xl px-5 pt-6 sm:px-8">
      <LedgerPageHeader eyebrow="account" title="My Profile" />

      <div class="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0">
        <section class="lg:col-span-7 lg:pr-10">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div class="relative shrink-0">
              <button
                type="button"
                class="group relative flex h-24 w-24 items-center justify-center overflow-hidden border border-rule bg-inset text-muted"
                aria-label="Change profile picture"
                @click="handleAvatarClick"
              >
                <img
                  v-if="avatarPreview || user?.avatar_url"
                  :src="avatarPreview || user?.avatar_url"
                  alt="Profile"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <span v-else class="text-3xl font-semibold uppercase">
                  {{ user?.first_name?.charAt(0) || user?.username?.charAt(0) }}
                </span>

                <span
                  class="absolute inset-0 hidden items-center justify-center bg-ink/45 text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
                >
                  <Icon name="material-symbols:photo-camera" class="text-2xl" />
                </span>

                <span
                  v-if="isUploading"
                  class="absolute inset-0 z-30 flex items-center justify-center bg-white/80"
                >
                  <Icon
                    name="material-symbols:sync"
                    class="animate-spin text-2xl text-ink"
                    aria-hidden="true"
                  />
                </span>
              </button>
              <!--
              <span
                aria-hidden="true"
                class="pointer-events-none absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center bg-ink text-white"
              >
                <Icon name="material-symbols:photo-camera" class="text-sm" />
              </span> -->

              <input
                type="file"
                ref="fileInput"
                accept="image/jpeg, image/png, image/webp"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>

            <div class="min-w-0">
              <h2
                v-if="user?.first_name"
                class="led-display text-[30px] sm:text-[34px]"
              >
                {{ user?.first_name }} {{ user?.last_name }}
              </h2>

              <p class="mt-1 font-mono text-[12px] text-muted">
                @{{ user?.username }}
              </p>
              <p class="mt-1 break-words text-sm text-muted">
                {{ user?.email }}
              </p>

              <span class="led-eyebrow mt-3 flex items-center gap-2 capitalize">
                <span class="h-1.5 w-1.5 rounded-[1px] bg-rule-strong"></span>
                {{ (user?.unit?.replace("_", " ") || "Unit").toLowerCase() }}
              </span>
            </div>
          </div>
        </section>

        <aside
          class="grid grid-cols-2 gap-8 lg:col-span-5 lg:border-l lg:border-rule lg:pl-10"
        >
          <div>
            <LedgerStat :value="localStats.totalScans" label="total scans" />
          </div>

          <div>
            <LedgerStat
              :value="localStats.unsynced"
              label="unsynced"
              tone="error"
            />
            <button
              v-if="localStats.unsynced > 0"
              type="button"
              @click="$router.push('/scanner')"
              class="mt-2 inline-flex min-h-11 items-center font-mono text-[11px] text-chapel transition-colors hover:text-chapel-strong"
            >
              open scanner
            </button>
          </div>
        </aside>
      </div>

      <section class="mt-10 border-t border-rule-strong pt-6">
        <p class="led-eyebrow">security</p>

        <div class="mt-4 border-t border-rule">
          <button
            type="button"
            @click="isPasswordModalOpen = true"
            class="flex w-full items-center justify-between gap-4 border-b border-rule py-4 text-left transition-colors hover:bg-inset/60"
          >
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-ink"
                >Change password</span
              >
              <span class="mt-0.5 block text-xs text-muted"
                >Update the credentials you use to sign in.</span
              >
            </span>
            <span class="led-eyebrow shrink-0 text-chapel">change</span>
          </button>

          <button
            type="button"
            @click="handleLogout"
            class="flex w-full items-center justify-between gap-4 border-b border-rule py-4 text-left transition-colors hover:bg-inset/60"
          >
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-ink">Sign out</span>
              <span class="mt-0.5 block text-xs text-muted"
                >End this session and clear local data on this device.</span
              >
            </span>
            <span class="led-eyebrow shrink-0 text-status-error">sign out</span>
          </button>
        </div>
      </section>
    </main>

    <Teleport to="body">
      <div
        v-if="isActionMenuOpen"
        class="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4"
        @click.self="isActionMenuOpen = false"
      >
        <div
          ref="actionMenuRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-picture-dialog-title"
          tabindex="-1"
          class="w-full max-w-sm border border-rule bg-canvas"
        >
          <div
            class="flex items-center justify-between border-b border-rule px-5 py-4"
          >
            <h3
              id="profile-picture-dialog-title"
              class="led-display text-[22px]"
            >
              Profile picture
            </h3>
            <button
              type="button"
              @click="isActionMenuOpen = false"
              aria-label="Close profile picture options"
              class="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-ink"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <div class="border-b border-rule">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 border-b border-rule px-5 py-4 text-left transition-colors hover:bg-inset/60"
              @click="openExpandedView"
            >
              <span class="text-sm font-semibold text-ink">View picture</span>
              <span class="led-eyebrow">open</span>
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 border-b border-rule px-5 py-4 text-left transition-colors hover:bg-inset/60"
              @click="triggerFileInput"
            >
              <span class="text-sm font-semibold text-ink">Change picture</span>
              <span class="led-eyebrow">upload</span>
            </button>

            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-inset/60"
              @click="handleRemoveAvatar"
            >
              <span class="text-sm font-semibold text-ink">Remove picture</span>
              <span class="led-eyebrow text-status-error">remove</span>
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
        class="fixed inset-0 z-modal flex items-center justify-center bg-ink/60 p-4"
        @click.self="closePasswordModal"
      >
        <div
          ref="passwordModalRef"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
          tabindex="-1"
          class="w-full max-w-sm border border-rule bg-canvas"
        >
          <div
            class="flex items-center justify-between border-b border-rule px-5 py-4"
          >
            <h3 id="change-password-title" class="led-display text-[22px]">
              Change password
            </h3>
            <button
              type="button"
              @click="closePasswordModal"
              aria-label="Close change password dialog"
              class="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-ink"
            >
              <Icon name="material-symbols:close" class="text-xl" />
            </button>
          </div>

          <form @submit.prevent="submitPasswordChange" class="p-5">
            <div>
              <label class="led-eyebrow mb-2 block">current password</label>
              <div class="relative">
                <input
                  v-model="passwordData.current"
                  :type="showPassword.current ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  class="led-field pr-11"
                  :class="{ 'border-status-error bg-[#fdf0ef]': passwordError }"
                />
                <button
                  type="button"
                  @click="showPassword.current = !showPassword.current"
                  :aria-label="
                    showPassword.current
                      ? 'Hide current password'
                      : 'Show current password'
                  "
                  :aria-pressed="showPassword.current"
                  class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
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

            <div class="mt-4">
              <label class="led-eyebrow mb-2 block">new password</label>
              <div class="relative">
                <input
                  v-model="passwordData.new"
                  :type="showPassword.new ? 'text' : 'password'"
                  required
                  minlength="6"
                  autocomplete="new-password"
                  class="led-field pr-11"
                />
                <button
                  type="button"
                  @click="showPassword.new = !showPassword.new"
                  :aria-label="
                    showPassword.new ? 'Hide new password' : 'Show new password'
                  "
                  :aria-pressed="showPassword.new"
                  class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
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

            <div class="mt-4">
              <label class="led-eyebrow mb-2 block">confirm new password</label>
              <div class="relative">
                <input
                  v-model="passwordData.confirm"
                  :type="showPassword.confirm ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  class="led-field pr-11"
                />
                <button
                  type="button"
                  @click="showPassword.confirm = !showPassword.confirm"
                  :aria-label="
                    showPassword.confirm
                      ? 'Hide confirmation password'
                      : 'Show confirmation password'
                  "
                  :aria-pressed="showPassword.confirm"
                  class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
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

            <p
              v-if="passwordError"
              class="mt-4 flex items-start gap-2 border-l-2 border-status-error bg-[#fdf0ef] p-3 text-xs text-status-error"
            >
              {{ passwordError }}
            </p>

            <button
              type="submit"
              :disabled="isChangingPassword"
              class="led-btn led-btn-primary mt-5 w-full"
            >
              <Icon
                v-if="isChangingPassword"
                name="material-symbols:sync"
                class="animate-spin text-lg"
              />
              {{ isChangingPassword ? "Updating" : "Update password" }}
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
import { useAppToast } from "~/composables/useAppToast";
import { useConfirm } from "~/composables/useConfirm";
import { useModalA11y } from "~/composables/useModalA11y";
import { db } from "~/utils/db";

const confirm = useConfirm();
const router = useRouter();
const { user, logout } = useAuth();
const toast = useAppToast();

const isPasswordModalOpen = ref(false);
const passwordModalRef = ref(null);
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

useModalA11y(isPasswordModalOpen, passwordModalRef, {
  onClose: closePasswordModal,
  initialFocusSelector: "input",
});

const submitPasswordChange = async () => {
  passwordError.value = "";

  if (passwordData.value.new !== passwordData.value.confirm) {
    passwordError.value = "New passwords do not match.";
    return;
  }

  if (/\s/.test(passwordData.value.new)) {
    passwordError.value = "Password cannot contain spaces or whitespace.";
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
const actionMenuRef = ref(null);
const isExpandedViewOpen = ref(false);

useModalA11y(isActionMenuOpen, actionMenuRef, {
  onClose: () => {
    isActionMenuOpen.value = false;
  },
});

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
    title: "Sign out?",
    message:
      "Are you sure you want to sign out? This will clear your local session data.",
    confirmText: "Sign out",
    cancelText: "Cancel",
    isDestructive: true,
  });

  if (isConfirmed) {
    await logout();
    router.push("/login");
  }
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
  animation: fadeIn 180ms ease-out forwards;
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
