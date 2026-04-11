<template>
  <div class="flex flex-col gap-6">
    <section
      class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm transition-all duration-200"
    >
      <h2 class="text-md font-black font-poppins mb-6 flex items-center gap-2">
        <Icon name="material-symbols:add-circle" class="text-md text-black" />
        Create Event
      </h2>

      <form @submit.prevent="handleCreateEvent" class="space-y-6">
        <div class="space-y-2">
          <label
            class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
            >Event Name</label
          >
          <input
            v-model="newEvent.name"
            type="text"
            placeholder="e.g. Annual Symposium 2026"
            required
            class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
          />
        </div>
        <div class="space-y-2">
          <label
            class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
            >Date</label
          >
          <input
            v-model="newEvent.date"
            type="date"
            required
            class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 outline-none"
          />
        </div>
        <div class="pt-2">
          <button
            type="submit"
            :disabled="isCreatingEvent"
            class="w-full bg-black text-white font-bold font-poppins py-4 rounded-md shadow-md hover:bg-gray-900 transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
          >
            <Icon
              v-if="isCreatingEvent"
              name="material-symbols:sync"
              class="animate-spin text-lg"
            />
            <Icon
              v-else
              name="material-symbols:arrow-forward"
              class="text-lg"
            />
            {{ isCreatingEvent ? "Creating..." : "Initialize Event" }}
          </button>
        </div>
      </form>
    </section>

    <section
      class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm transition-all duration-200"
    >
      <h2 class="text-md font-black font-poppins mb-6 flex items-center gap-2">
        <Icon name="material-symbols:person-add" class="text-md text-black" />
        Create User
      </h2>

      <form @submit.prevent="handleCreateUser" class="space-y-6">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label
              class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
              >Username</label
            >
            <div
              class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-gray-500"
              title="Usernames are automatically formatted to lowercase"
            >
              <Icon name="material-symbols:info-outline" class="text-xs" />
              <span class="text-[0.65rem] font-bold uppercase tracking-widest"
                >Lowercase Only</span
              >
            </div>
          </div>

          <div class="relative">
            <input
              v-model="newUser.username"
              @input="handleUsernameInput"
              type="text"
              placeholder="e.g. usher_john"
              required
              class="w-full border focus:border-black rounded-md py-3 pl-4 pr-10 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
              :class="
                usernameStatus === 'taken'
                  ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                  : 'border-gray-400'
              "
            />

            <div class="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
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

          <div class="h-4">
            <p
              v-if="usernameStatus === 'taken'"
              class="text-xs text-red-500 font-bold font-poppins animate-fade-in"
            >
              This username is already taken.
            </p>
            <p
              v-else-if="usernameStatus === 'available'"
              class="text-xs text-green-600 font-bold font-poppins animate-fade-in"
            >
              Username is available!
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label
              class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
              >Password</label
            >
          </div>
          <div class="relative group">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors"
            >
              <Icon name="material-symbols:lock" class="text-lg" />
            </div>
            <input
              v-model="newUser.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="w-full border-gray-400 focus:border-black border rounded-md py-3 pl-11 pr-12 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black focus:text-black transition-colors outline-none"
              :title="showPassword ? 'Hide password' : 'Show password'"
            >
              <Icon
                :name="
                  showPassword
                    ? 'material-symbols:visibility-off'
                    : 'material-symbols:visibility'
                "
                class="text-lg"
              />
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label
            class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
            >Role</label
          >
          <select
            v-model="newUser.role"
            class="w-full border-gray-300 border focus:border-black rounded-md mt-1 py-3 px-4 text-black font-poppins transition-all duration-200 outline-none bg-white"
          >
            <option value="USHER" class="text-sm">Usher (Scanner Only)</option>
            <option value="SUPER_ADMIN" class="text-sm">
              Super Admin (Full Access)
            </option>
          </select>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="isCreatingUser || usernameStatus === 'taken'"
            class="w-full bg-black text-white font-bold font-poppins py-4 rounded-md shadow-md hover:bg-gray-900 transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
          >
            <Icon
              v-if="isCreatingUser"
              name="material-symbols:sync"
              class="animate-spin text-lg"
            />
            <Icon v-else name="material-symbols:person-add" class="text-lg" />
            {{ isCreatingUser ? "Creating..." : "Register User" }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAdmin } from "~/composables/useAdmin";

const { checkUsernameAvailability } = useAdmin();

const emit = defineEmits(["eventCreated", "userCreated"]);

const isCreatingEvent = ref(false);
const isCreatingUser = ref(false);
const showPassword = ref(false);

const usernameStatus = ref("idle");
let typingTimer = null;

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0],
});

const newUser = ref({
  username: "",
  password: "",
  role: "USHER",
});

const handleUsernameInput = () => {
  // NEW: Instantly force the input to lowercase as they type!
  newUser.value.username = newUser.value.username.toLowerCase();

  usernameStatus.value = "idle";
  clearTimeout(typingTimer);

  const currentUsername = newUser.value.username;

  if (currentUsername.length < 3) {
    return;
  }

  usernameStatus.value = "checking";

  typingTimer = setTimeout(async () => {
    const isAvailable = await checkUsernameAvailability(currentUsername);
    if (isAvailable === true) {
      usernameStatus.value = "available";
    } else if (isAvailable === false) {
      usernameStatus.value = "taken";
    } else {
      usernameStatus.value = "idle";
    }
  }, 500);
};

const handleCreateEvent = async () => {
  isCreatingEvent.value = true;
  emit("eventCreated", newEvent.value, (success) => {
    if (success) {
      newEvent.value.name = "";
    }
    isCreatingEvent.value = false;
  });
};

const handleCreateUser = async () => {
  if (usernameStatus.value === "taken") return;

  isCreatingUser.value = true;
  emit("userCreated", newUser.value, (success) => {
    if (success) {
      newUser.value = { username: "", password: "", role: "USHER" };
      usernameStatus.value = "idle";
    }
    isCreatingUser.value = false;
  });
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
