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
            <form
              @submit.prevent="handleCreateUser"
              class="space-y-6 animate-fade-in mt-8"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >Email*</label
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
                    v-model="newUser.email"
                    @input="handleEmailInput"
                    type="email"
                    placeholder="e.g. okodughapeter@gmail.com"
                    required
                    class="w-full border focus:border-black rounded-md py-3 pl-4 pr-10 mt-2 text-black font-poppins transition-all duration-200 placeholder:text-gray-400 outline-none"
                    :class="
                      emailStatus === 'taken' || emailStatus === 'invalid'
                        ? 'border-red-500 focus:border-red-600 bg-red-50/30'
                        : 'border-gray-400'
                    "
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
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
                <div class="h-4" v-if="emailStatus === 'taken'">
                  <p class="text-xs text-red-500 font-bold font-poppins">
                    This email is already taken.
                  </p>
                </div>
                <div class="h-4" v-if="emailStatus === 'invalid'">
                  <p class="text-xs text-red-500 font-bold font-poppins">
                    Please enter a valid email address.
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

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div class="space-y-2">
                  <label
                    class="text-[0.75rem] font-bold uppercase tracking-wider text-gray-400 font-poppins"
                    >Assigned Unit*</label
                  >
                  <select
                    v-model="newUser.unit"
                    required
                    class="w-full border-gray-300 border focus:border-black rounded-md mt-1 py-3 px-4 text-black font-poppins transition-all duration-200 outline-none bg-white"
                  >
                    <option value="USHER" class="text-sm">Usher</option>
                    <option value="DRAMA" class="text-sm">Drama</option>
                    <option value="MEDIA" class="text-sm">Media</option>
                    <option value="CHOIR" class="text-sm">Choir</option>
                    <option value="TECHNICAL" class="text-sm">Technical</option>
                    <option value="ACADEMIC" class="text-sm">Academic</option>
                    <option value="BIBLE_STUDY" class="text-sm">
                      Bible Study
                    </option>
                    <option value="BROTHERS" class="text-sm">Brothers</option>
                    <option value="EVANGELISM" class="text-sm">
                      Evangelism
                    </option>
                    <option value="PRAYER" class="text-sm">Prayer</option>
                    <option value="PROTOCOL" class="text-sm">Protocol</option>
                    <option value="SISTERS" class="text-sm">Sisters</option>
                    <option value="WELFARE" class="text-sm">Welfare</option>
                    <option value="EDITORIAL" class="text-sm">Editorial</option>
                    <option value="OTHER" class="text-sm">Other</option>
                  </select>
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingUser || emailStatus !== 'available'"
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
          </div>
        </div>
      </Transition>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAdmin } from "~/composables/useAdmin";
import { useAppToast } from "~/composables/useAppToast"; // Added for safety alerts

const { checkAvailability } = useAdmin();
const toast = useAppToast();
const emit = defineEmits(["eventCreated", "userCreated"]);

const isEventFormOpen = ref(false);
const isUserFormOpen = ref(false);

const isCreatingEvent = ref(false);
const isCreatingUser = ref(false);
const showPassword = ref(false);

const emailStatus = ref("idle");
let typingTimer = null;

const newEvent = ref({
  name: "",
  date: new Date().toISOString().split("T")[0],
});

// REMOVED username from default state
const newUser = ref({
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  role: "USHER",
  unit: "USHER",
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handleEmailInput = () => {
  newUser.value.email = newUser.value.email.toLowerCase().trim();
  emailStatus.value = "idle";
  clearTimeout(typingTimer);

  if (newUser.value.email.length < 3) return;

  if (!emailRegex.test(newUser.value.email)) {
    emailStatus.value = "invalid";
    return;
  }

  emailStatus.value = "checking";
  typingTimer = setTimeout(async () => {
    const isAvailable = await checkAvailability("email", newUser.value.email);
    if (isAvailable === true) emailStatus.value = "available";
    else if (isAvailable === false) emailStatus.value = "taken";
    else emailStatus.value = "idle";
  }, 500);
};

// NEW: Helper function to generate a unique username from the email
const generateUsername = (email) => {
  const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""); // Remove dots/special chars
  const randomSuffix = Math.random().toString(36).substring(2, 6); // Add 4 random chars
  return `${prefix}_${randomSuffix}`;
};

const handleCreateEvent = async () => {
  isCreatingEvent.value = true;
  emit("eventCreated", newEvent.value, (success) => {
    if (success) {
      newEvent.value.name = "";
      isEventFormOpen.value = false;
    }
    isCreatingEvent.value = false;
  });
};

const handleCreateUser = async () => {
  // STRICT GUARD: Prevent sneaky submissions
  if (emailStatus.value !== "available") {
    toast.error("Please provide a valid and available email.");
    return;
  }

  isCreatingUser.value = true;

  // Attach the autogenerated username dynamically to the payload
  const payloadToSubmit = {
    ...newUser.value,
    username: generateUsername(newUser.value.email),
  };

  emit("userCreated", payloadToSubmit, (success) => {
    if (success) {
      newUser.value = {
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "USHER",
        unit: "USHER",
      };
      emailStatus.value = "idle";
    }
    isCreatingUser.value = false;
  });
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
