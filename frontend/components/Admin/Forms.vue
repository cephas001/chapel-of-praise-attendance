<template>
  <div class="flex flex-col gap-6">
    <section
      class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
    >
      <button
        @click="isEventFormOpen = !isEventFormOpen"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <h2 class="text-md font-black font-poppins flex items-center gap-2 m-0">
          <Icon name="material-symbols:add-circle" class="text-md text-black" />
          Create Event
        </h2>
        <div
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isEventFormOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-black"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-show="isEventFormOpen">
          <div
            class="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-gray-100 mt-2"
          >
            <form @submit.prevent="handleCreateEvent" class="space-y-6 pt-4">
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
          </div>
        </div>
      </Transition>
    </section>

    <section
      class="bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-200 overflow-hidden"
    >
      <button
        @click="isUserFormOpen = !isUserFormOpen"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
      >
        <h2 class="text-md font-black font-poppins flex items-center gap-2 m-0">
          <Icon name="material-symbols:person-add" class="text-md text-black" />
          Create User(s)
        </h2>
        <div
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isUserFormOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-black"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-show="isUserFormOpen">
          <div
            class="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-gray-100 mt-2"
          >
            <div class="flex justify-end mb-6 pt-4">
              <div
                class="bg-gray-100 p-1 rounded-lg flex gap-1 text-xs font-bold uppercase tracking-wider font-poppins"
              >
                <button
                  @click="creationMode = 'single'"
                  :class="
                    creationMode === 'single'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-400 hover:text-black'
                  "
                  class="px-3 py-1.5 rounded-md transition-all"
                >
                  Single
                </button>
                <button
                  @click="creationMode = 'bulk'"
                  :class="
                    creationMode === 'bulk'
                      ? 'bg-white shadow-sm text-black'
                      : 'text-gray-400 hover:text-black'
                  "
                  class="px-3 py-1.5 rounded-md transition-all"
                >
                  Bulk List
                </button>
              </div>
            </div>

            <form
              v-if="creationMode === 'single'"
              @submit.prevent="handleCreateUser"
              class="space-y-6 animate-fade-in"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >Username*</label
                  >
                  <div
                    class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-gray-500"
                  >
                    <Icon
                      name="material-symbols:info-outline"
                      class="text-xs"
                    />
                    <span
                      class="text-[0.65rem] font-bold uppercase tracking-widest"
                      >Lowercase Only</span
                    >
                  </div>
                </div>

                <div class="relative">
                  <input
                    v-model="newUser.username"
                    @input="handleUsernameInput"
                    type="text"
                    placeholder="e.g. peter"
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
                <div class="h-4" v-if="usernameStatus === 'taken'">
                  <p class="text-xs text-red-500 font-bold font-poppins">
                    This username is already taken.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >First Name
                  </label>
                  <input
                    v-model="newUser.first_name"
                    type="text"
                    placeholder="Peter"
                    class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins outline-none"
                  />
                </div>
                <div class="space-y-2">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >Last Name
                  </label>
                  <input
                    v-model="newUser.last_name"
                    type="text"
                    placeholder="Okodugha"
                    class="w-full border-gray-400 focus:border-black border rounded-md py-3 px-4 mt-2 text-black font-poppins outline-none"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >Password*</label
                  >
                </div>
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"
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
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black outline-none"
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
                  >Role*</label
                >
                <select
                  v-model="newUser.role"
                  class="w-full border-gray-300 border focus:border-black rounded-md mt-1 py-3 px-4 text-black font-poppins transition-all duration-200 outline-none bg-white"
                >
                  <option value="USHER" class="text-sm">
                    Usher (Scanner Only)
                  </option>
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
                  <Icon
                    v-else
                    name="material-symbols:person-add"
                    class="text-lg"
                  />
                  {{ isCreatingUser ? "Creating..." : "Register User" }}
                </button>
              </div>
            </form>

            <form
              v-else
              @submit.prevent="handleBulkCreate"
              class="space-y-6 animate-fade-in pt-2"
            >
              <div
                class="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800"
              >
                <p class="text-sm font-medium font-poppins leading-relaxed">
                  Paste a list of first names. The system will auto-generate
                  accounts where <strong>Username</strong> = name (lowercase)
                  and <strong>Password</strong> =
                  <code class="bg-blue-100 px-1 rounded">admin[name]</code>.
                </p>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                  >Names List</label
                >
                <textarea
                  v-model="bulkNamesList"
                  rows="6"
                  placeholder="Peter, John, Mary&#10;Or paste a column from Google Sheets..."
                  required
                  class="w-full border border-gray-400 focus:border-black rounded-md py-3 px-4 mt-2 text-black font-poppins outline-none resize-none"
                ></textarea>
              </div>

              <div
                v-if="bulkResults.total > 0"
                class="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center"
              >
                <div>
                  <span class="block text-2xl font-black">{{
                    bulkResults.total
                  }}</span
                  ><span
                    class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                    >Found</span
                  >
                </div>
                <div>
                  <span class="block text-2xl font-black text-green-600">{{
                    bulkResults.success
                  }}</span
                  ><span
                    class="text-[10px] font-bold text-green-600 uppercase tracking-widest"
                    >Created</span
                  >
                </div>
                <div>
                  <span class="block text-2xl font-black text-orange-500">{{
                    bulkResults.skipped
                  }}</span
                  ><span
                    class="text-[10px] font-bold text-orange-500 uppercase tracking-widest"
                    >Skipped</span
                  >
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingUser || !bulkNamesList"
                  class="w-full bg-black text-white font-bold font-poppins py-4 rounded-md shadow-md hover:bg-gray-900 active:scale-[0.98] flex justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  <Icon
                    v-if="isCreatingUser"
                    name="material-symbols:sync"
                    class="animate-spin text-lg"
                  />
                  <Icon
                    v-else
                    name="material-symbols:group-add"
                    class="text-lg"
                  />
                  {{
                    isCreatingUser
                      ? `Processing (${bulkResults.success}/${bulkResults.total})...`
                      : "Generate Accounts"
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAdmin } from "~/composables/useAdmin";
import { useToast } from "~/composables/useToast";

const { checkUsernameAvailability } = useAdmin();
const emit = defineEmits(["eventCreated", "userCreated"]);
const toast = useToast();

// NEW: UI State for the Accordions. False = Collapsed by default.
const isEventFormOpen = ref(false);
const isUserFormOpen = ref(false);

const isCreatingEvent = ref(false);
const isCreatingUser = ref(false);
const showPassword = ref(false);
const creationMode = ref("single");

const usernameStatus = ref("idle");
let typingTimer = null;

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0],
});

const newUser = ref({
  username: "",
  first_name: "",
  last_name: "",
  password: "",
  role: "USHER",
});

const bulkNamesList = ref("");
const bulkResults = ref({ total: 0, success: 0, skipped: 0 });

const handleUsernameInput = () => {
  newUser.value.username = newUser.value.username.toLowerCase().trim();
  usernameStatus.value = "idle";
  clearTimeout(typingTimer);

  if (newUser.value.username.length < 3) return;

  usernameStatus.value = "checking";
  typingTimer = setTimeout(async () => {
    const isAvailable = await checkUsernameAvailability(newUser.value.username);
    if (isAvailable === true) usernameStatus.value = "available";
    else if (isAvailable === false) usernameStatus.value = "taken";
    else usernameStatus.value = "idle";
  }, 500);
};

const handleCreateEvent = async () => {
  isCreatingEvent.value = true;
  emit("eventCreated", newEvent.value, (success) => {
    if (success) {
      newEvent.value.name = "";
      isEventFormOpen.value = false; // Auto-close accordion on success!
    }
    isCreatingEvent.value = false;
  });
};

const handleCreateUser = async () => {
  if (usernameStatus.value === "taken") return;
  isCreatingUser.value = true;
  emit("userCreated", newUser.value, (success) => {
    if (success) {
      newUser.value = {
        username: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "USHER",
      };
      usernameStatus.value = "idle";
    }
    isCreatingUser.value = false;
  });
};

const handleBulkCreate = async () => {
  if (!bulkNamesList.value) return;
  isCreatingUser.value = true;

  const rawNames = bulkNamesList.value
    .split(/[\n,]+/)
    .map((n) => n.trim())
    .filter((n) => n);
  bulkResults.value = { total: rawNames.length, success: 0, skipped: 0 };

  for (const name of rawNames) {
    const safeUsername = name.toLowerCase();
    const isAvailable = await checkUsernameAvailability(safeUsername);

    if (isAvailable) {
      const payload = {
        username: safeUsername,
        first_name: name.trim(),
        password: `admin${safeUsername}`,
        role: "USHER",
      };

      await new Promise((resolve) => {
        emit("userCreated", payload, (success) => {
          if (success) bulkResults.value.success++;
          resolve();
        });
      });
    } else {
      bulkResults.value.skipped++;
    }
  }

  toast.success(
    `Bulk Import Complete!\nCreated: ${bulkResults.value.success}\nSkipped (Already Taken): ${bulkResults.value.skipped}`,
  );
  bulkNamesList.value = "";
  isCreatingUser.value = false;
};
</script>

<style scoped>
/* Fluid Accordion Animation */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 800px; /* Provides enough room for the forms to slide down */
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
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
