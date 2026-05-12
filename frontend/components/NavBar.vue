<template>
  <div>
    <nav
      v-if="token"
      class="fixed top-0 left-0 w-full z-40 bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-100 font-sans"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center gap-3" @click="navigateTo('/')">
            <div
              class="bg-black text-white w-8 h-8 rounded-xl shadow-sm flex items-center justify-center"
            >
              <Icon name="material-symbols:token" class="text-md" />
            </div>
            <span
              class="font-black text-black tracking-wide text-lg font-montserrat uppercase"
            >
              COPAMS
            </span>
          </div>

          <div
            class="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 mt-1"
          >
            <NuxtLink
              to="/scanner"
              class="font-montserrat text-sm tracking-wide transition-all duration-200 pb-1 border-b-2"
              :class="
                $route.path === '/scanner'
                  ? 'font-black text-black border-black'
                  : 'font-semibold text-gray-500 border-transparent hover:text-black'
              "
            >
              Scanner
            </NuxtLink>

            <NuxtLink
              v-if="user?.role === 'SUPER_ADMIN'"
              to="/admin"
              class="font-montserrat text-sm tracking-wide transition-all duration-200 pb-1 border-b-2"
              :class="
                $route.path === '/admin'
                  ? 'font-black text-black border-black'
                  : 'font-semibold text-gray-500 border-transparent hover:text-black'
              "
            >
              Dashboard
            </NuxtLink>

            <NuxtLink
              to="/profile"
              class="font-montserrat text-sm tracking-wide transition-all duration-200 pb-1 border-b-2"
              :class="
                $route.path === '/profile'
                  ? 'font-black text-black border-black'
                  : 'font-semibold text-gray-500 border-transparent hover:text-black'
              "
            >
              My Profile
            </NuxtLink>

            <NuxtLink
              to="/roster"
              class="font-montserrat text-sm tracking-wide transition-all duration-200 pb-1 border-b-2"
              :class="
                $route.path === '/roster'
                  ? 'font-black text-black border-black'
                  : 'font-semibold text-gray-500 border-transparent hover:text-black'
              "
            >
              Active Rosters
            </NuxtLink>
          </div>

          <div class="flex items-center gap-2 sm:gap-4">
            <div class="hidden lg:flex flex-col text-right mr-1">
              <span class="text-xs font-black text-black font-montserrat">{{
                user?.username
              }}</span>
              <span
                class="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-montserrat mt-0.5"
              >
                {{ user?.role?.replace("_", " ") }}
              </span>
            </div>

            <div
              class="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 border border-gray-200 items-center justify-center text-gray-400 overflow-hidden shadow-inner"
            >
              <Icon name="material-symbols:person" class="text-xl" />
            </div>

            <div class="h-6 w-px bg-gray-200 hidden sm:block mx-1"></div>

            <button
              @click="handleLogout"
              title="Logout"
              class="hidden sm:flex text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-full transition-all duration-200 active:scale-95 items-center justify-center"
            >
              <Icon name="material-symbols:logout" class="text-xl" />
            </button>

            <NuxtLink
              to="/inbox"
              class="relative p-2 text-gray-600 hover:text-black transition-colors flex items-center justify-center"
            >
              <Icon name="material-symbols:notifications" class="text-2xl" />

              <span
                v-if="unreadCount > 0"
                class="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white"
              >
                {{ unreadCount > 9 ? "9+" : unreadCount }}
              </span>
            </NuxtLink>

            <button
              @click="isMobileMenuOpen = true"
              class="md:hidden text-black p-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <Icon name="material-symbols:menu" class="text-2xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div
      v-if="isMobileMenuOpen && token"
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden transition-opacity duration-300"
    ></div>

    <aside
      v-if="token"
      class="fixed top-0 right-0 z-[60] h-full w-[280px] bg-white shadow-2xl flex flex-col md:hidden transition-transform duration-300 ease-in-out transform"
      :class="isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div
        class="h-20 px-6 flex items-center justify-between border-b border-gray-100 shrink-0"
      >
        <span
          class="font-black text-black font-montserrat uppercase tracking-wider"
        >
          Menu
        </span>
        <button
          @click="isMobileMenuOpen = false"
          class="p-2 bg-gray-50 rounded-full hover:bg-gray-200 text-black transition-colors flex items-center"
        >
          <Icon name="material-symbols:close" class="text-xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
        <NuxtLink
          to="/scanner"
          @click="isMobileMenuOpen = false"
          class="p-4 rounded-xl font-poppins font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 border"
          :class="
            $route.path === '/scanner'
              ? 'bg-gray-100 text-black border-gray-200 shadow-inner'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-black hover:border-gray-200'
          "
        >
          Scanner
        </NuxtLink>

        <NuxtLink
          to="/inbox"
          @click="isMobileMenuOpen = false"
          class="p-4 rounded-xl font-poppins font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 border"
          :class="
            $route.path === '/inbox'
              ? 'bg-gray-100 text-black border-gray-200 shadow-inner'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-black hover:border-gray-200'
          "
        >
          Inbox
          <span
            v-if="unreadCount > 0"
            class="p-1 bg-red-500 rounded-xl flex items-center justify-center text-[8px] font-black text-white text-center"
          >
            {{ unreadCount > 9 ? "9+" : unreadCount }}
          </span>
        </NuxtLink>

        <NuxtLink
          to="/profile"
          @click="isMobileMenuOpen = false"
          class="p-4 rounded-xl font-poppins font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 border"
          :class="
            $route.path === '/profile'
              ? 'bg-gray-100 text-black border-gray-200 shadow-inner'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-black hover:border-gray-200'
          "
        >
          My Profile
        </NuxtLink>

        <NuxtLink
          to="/roster"
          @click="isMobileMenuOpen = false"
          class="p-4 rounded-xl font-poppins font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 border"
          :class="
            $route.path === '/roster'
              ? 'bg-gray-100 text-black border-gray-200 shadow-inner'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-black hover:border-gray-200'
          "
        >
          Active Rosters
        </NuxtLink>

        <NuxtLink
          v-if="user?.role === 'SUPER_ADMIN'"
          to="/admin"
          @click="isMobileMenuOpen = false"
          class="p-4 rounded-xl font-poppins font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-3 border"
          :class="
            $route.path === '/admin'
              ? 'bg-gray-100 text-black border-gray-200 shadow-inner'
              : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-black hover:border-gray-200'
          "
        >
          Dashboard
        </NuxtLink>
      </div>

      <div class="p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <div
          class="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm"
        >
          <div class="flex items-center gap-3 overflow-hidden">
            <NuxtLink
              class="h-10 w-10 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200"
              to="/profile"
              @click="isMobileMenuOpen = false"
            >
              <img
                v-if="user.avatar_url"
                :src="user.avatar_url"
                loading="lazy"
                alt="Avatar"
                class="w-full h-full object-cover rounded-full"
              />
              <Icon v-else name="material-symbols:person" class="text-xl" />
            </NuxtLink>
            <div class="flex flex-col truncate">
              <span
                class="text-sm font-black text-black font-poppins truncate"
                >{{ user?.username }}</span
              >
              <span
                class="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-poppins truncate"
              >
                {{ user?.role?.replace("_", " ") }}
              </span>
            </div>
          </div>

          <button
            @click="handleLogout"
            title="Logout"
            class="shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-lg flex items-center justify-center transition-colors"
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

const { unreadCount } = useMessages();
const { user, token, logout } = useAuth();
const router = useRouter();
const confirm = useConfirm();

// Controls the mobile slide-out drawer
const isMobileMenuOpen = ref(false);

const handleLogout = async () => {
  // 1. Await the user's response from the custom modal
  const isConfirmed = await confirm.ask({
    title: "Log Out?",
    message:
      "This will end your current session and require you to log in again.",
    confirmText: "Log Out",
    cancelText: "Cancel",
    isDestructive: true, // Makes the confirmation button red for emphasis
  });

  // 2. If they click "Log Out", proceed with clearing the session
  if (isConfirmed) {
    logout();
    isMobileMenuOpen.value = false;
    router.push("/login");
  }
};
</script>
