<template>
  <div>
    <nav
      v-if="token"
      class="fixed left-0 top-0 z-nav w-full border-b border-rule bg-canvas/95 font-sans backdrop-blur"
    >
      <div
        class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8"
      >
        <NuxtLink
          to="/"
          class="flex shrink-0 items-center gap-2.5"
          aria-label="COPAMS home"
        >
          <span
            class="text-[15px] font-semibold uppercase tracking-[0.08em] text-ink"
          >
            COPAMS
          </span>
        </NuxtLink>

        <div class="hidden items-center gap-6 lg:flex">
          <NuxtLink
            to="/scanner"
            class="border-b-2 pb-1 text-[13px] font-medium transition-colors"
            :class="
              $route.path === '/scanner'
                ? 'border-chapel text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
          >
            Scanner
          </NuxtLink>

          <NuxtLink
            v-if="user?.role === 'SUPER_ADMIN'"
            to="/admin"
            class="border-b-2 pb-1 text-[13px] font-medium transition-colors"
            :class="
              $route.path === '/admin'
                ? 'border-chapel text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
          >
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="border-b-2 pb-1 text-[13px] font-medium transition-colors"
            :class="
              $route.path === '/profile'
                ? 'border-chapel text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
          >
            My Profile
          </NuxtLink>

          <NuxtLink
            to="/roster"
            class="border-b-2 pb-1 text-[13px] font-medium transition-colors"
            :class="
              $route.path === '/roster'
                ? 'border-chapel text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
          >
            Active Rosters
          </NuxtLink>
        </div>

        <div class="flex items-center gap-1 sm:gap-2">
          <div class="mr-2 hidden flex-col text-right lg:flex">
            <span class="text-[13px] font-semibold text-ink">{{
              user?.username
            }}</span>
            <span class="text-[11px] font-medium capitalize text-muted">
              {{ user?.role?.replace("_", " ").toLowerCase() }}
            </span>
          </div>

          <NuxtLink
            to="/profile"
            class="hidden h-9 w-9 items-center justify-center overflow-hidden border border-rule bg-inset text-muted sm:flex"
            :aria-label="
              user?.username
                ? `Open ${user.username}'s profile`
                : 'Open profile'
            "
          >
            <img
              v-if="user?.avatar_url"
              :src="user.avatar_url"
              :alt="`${user?.username || 'User'} avatar`"
              loading="lazy"
              class="h-full w-full object-cover"
            />
            <Icon v-else name="material-symbols:person" class="text-lg" />
          </NuxtLink>

          <span
            class="mx-2 hidden h-5 w-px bg-rule sm:block"
            aria-hidden="true"
          ></span>

          <button
            type="button"
            @click="handleLogout"
            title="Sign out"
            aria-label="Sign out"
            class="hidden h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-status-error sm:flex"
          >
            <Icon name="material-symbols:logout" class="text-xl" />
          </button>

          <NuxtLink
            to="/inbox"
            aria-label="Open inbox"
            class="relative flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
          >
            <Icon name="material-symbols:notifications" class="text-2xl" />

            <span
              v-if="unreadCount > 0"
              aria-hidden="true"
              class="absolute right-1.5 top-2 flex h-4 min-w-4 items-center justify-center rounded-[1px] bg-chapel px-1 font-mono text-[10px] text-white"
            >
              {{ unreadCount > 9 ? "9+" : unreadCount }}
            </span>
          </NuxtLink>

          <button
            ref="menuButtonRef"
            type="button"
            @click="openMobileMenu"
            aria-label="Open navigation menu"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="mobile-navigation"
            class="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-inset lg:hidden"
          >
            <Icon name="material-symbols:menu" class="text-2xl" />
          </button>
        </div>
      </div>
    </nav>

    <div
      v-if="isMobileMenuOpen && token"
      @click="isMobileMenuOpen = false"
      aria-hidden="true"
      class="fixed inset-0 z-modal bg-ink/50 lg:hidden"
    ></div>

    <aside
      v-if="token"
      id="mobile-navigation"
      ref="drawerRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-menu-title"
      :aria-hidden="!isMobileMenuOpen"
      :inert="!isMobileMenuOpen"
      tabindex="-1"
      class="fixed right-0 top-0 z-drawer flex h-full w-[280px] transform flex-col border-l border-rule bg-canvas transition-transform duration-300 ease-in-out lg:hidden"
      :class="isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div
        class="flex h-16 shrink-0 items-center justify-between border-b border-rule px-5"
      >
        <span id="mobile-menu-title" class="led-display text-[22px]"> </span>
        <button
          type="button"
          @click="isMobileMenuOpen = false"
          aria-label="Close navigation menu"
          class="flex h-11 w-11 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-ink"
        >
          <Icon name="material-symbols:close" class="text-xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <NuxtLink
          to="/scanner"
          @click="isMobileMenuOpen = false"
          class="block border-b border-rule px-5 py-4 text-[15px] font-medium transition-colors"
          :class="
            $route.path === '/scanner'
              ? 'bg-inset text-ink shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'text-muted hover:bg-inset/60 hover:text-ink'
          "
        >
          Scanner
        </NuxtLink>

        <NuxtLink
          to="/inbox"
          @click="isMobileMenuOpen = false"
          class="flex items-center justify-between border-b border-rule px-5 py-4 text-[15px] font-medium transition-colors"
          :class="
            $route.path === '/inbox'
              ? 'bg-inset text-ink shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'text-muted hover:bg-inset/60 hover:text-ink'
          "
        >
          Inbox
          <span
            v-if="unreadCount > 0"
            class="font-mono text-[11px] text-chapel"
          >
            {{ unreadCount > 9 ? "9+" : unreadCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          to="/profile"
          @click="isMobileMenuOpen = false"
          class="block border-b border-rule px-5 py-4 text-[15px] font-medium transition-colors"
          :class="
            $route.path === '/profile'
              ? 'bg-inset text-ink shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'text-muted hover:bg-inset/60 hover:text-ink'
          "
        >
          My Profile
        </NuxtLink>

        <NuxtLink
          to="/roster"
          @click="isMobileMenuOpen = false"
          class="block border-b border-rule px-5 py-4 text-[15px] font-medium transition-colors"
          :class="
            $route.path === '/roster'
              ? 'bg-inset text-ink shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'text-muted hover:bg-inset/60 hover:text-ink'
          "
        >
          Active Rosters
        </NuxtLink>

        <NuxtLink
          v-if="user?.role === 'SUPER_ADMIN'"
          to="/admin"
          @click="isMobileMenuOpen = false"
          class="block border-b border-rule px-5 py-4 text-[15px] font-medium transition-colors"
          :class="
            $route.path === '/admin'
              ? 'bg-inset text-ink shadow-[inset_2px_0_0_var(--color-chapel)]'
              : 'text-muted hover:bg-inset/60 hover:text-ink'
          "
        >
          Dashboard
        </NuxtLink>
      </div>

      <div class="shrink-0 border-t border-rule p-4">
        <div class="flex items-center justify-between gap-3">
          <NuxtLink
            class="flex min-w-0 items-center gap-3"
            to="/profile"
            :aria-label="
              user?.username
                ? `Open ${user.username}'s profile`
                : 'Open profile'
            "
            @click="isMobileMenuOpen = false"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-rule bg-inset text-muted"
            >
              <img
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                loading="lazy"
                :alt="`${user?.username || 'User'} avatar`"
                class="h-full w-full object-cover"
              />
              <Icon v-else name="material-symbols:person" class="text-xl" />
            </span>
            <span class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-semibold text-ink">{{
                user?.username
              }}</span>
              <span
                class="truncate text-[11px] font-medium capitalize text-muted"
              >
                {{ user?.role?.replace("_", " ").toLowerCase() }}
              </span>
            </span>
          </NuxtLink>

          <button
            type="button"
            @click="handleLogout"
            title="Sign out"
            aria-label="Sign out"
            class="flex h-11 w-11 shrink-0 items-center justify-center text-muted transition-colors hover:bg-inset hover:text-status-error"
          >
            <Icon name="material-symbols:logout" class="text-xl" />
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";
import { useConfirm } from "~/composables/useConfirm";
import { useMessages } from "~/composables/useMessages";
import { useModalA11y } from "~/composables/useModalA11y";

const { unreadCount, stopListening, clearInbox } = useMessages();
const { user, token, logout } = useAuth();
const router = useRouter();
const confirm = useConfirm();

// Controls the mobile slide-out drawer
const isMobileMenuOpen = ref(false);
const drawerRef = ref(null);
const menuButtonRef = ref(null);

const openMobileMenu = () => {
  // Focus the trigger before opening so focus can always be restored, even
  // when the open action came from a pointer/assistive click.
  menuButtonRef.value?.focus();
  isMobileMenuOpen.value = true;
};

useModalA11y(isMobileMenuOpen, drawerRef, {
  onClose: () => {
    isMobileMenuOpen.value = false;
  },
});

const handleLogout = async () => {
  // 1. Await the user's response from the custom modal
  const isConfirmed = await confirm.ask({
    title: "Sign out?",
    message:
      "This will end your current session and require you to sign in again.",
    confirmText: "Sign out",
    cancelText: "Cancel",
    isDestructive: true, // Makes the confirmation button red for emphasis
  });

  // 2. If they click "Sign out", proceed with clearing the session
  if (isConfirmed) {
    // Close the stream and drop cached inbox data before navigating away.
    stopListening();
    clearInbox();
    await logout();
    isMobileMenuOpen.value = false;
    router.push("/login");
  }
};
</script>
