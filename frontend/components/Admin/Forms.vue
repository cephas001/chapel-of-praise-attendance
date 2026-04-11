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
          <label
            class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
            >Username</label
          >
          <input
            v-model="newUser.username"
            type="text"
            placeholder="e.g. usher_john"
            required
            class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
          />
        </div>
        <div class="space-y-2">
          <label
            class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
            >Password</label
          >
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
            :disabled="isCreatingUser"
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

// Define the emits to send data back to the parent page
const emit = defineEmits(["eventCreated", "userCreated"]);

const isCreatingEvent = ref(false);
const isCreatingUser = ref(false);
const showPassword = ref(false);

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0],
});

const newUser = ref({
  username: "",
  password: "",
  role: "USHER",
});

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
  isCreatingUser.value = true;
  emit("userCreated", newUser.value, (success) => {
    if (success) {
      newUser.value = { username: "", password: "", role: "USHER" };
    }
    isCreatingUser.value = false;
  });
};
</script>
