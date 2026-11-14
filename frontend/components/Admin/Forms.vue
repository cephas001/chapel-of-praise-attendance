<template>
  <div class="flex flex-col gap-6">
    <section
      v-if="showEventSection"
      class="bg-white rounded-none border border-rule transition-colors duration-200 overflow-hidden"
    >
      <button
        @click="isEventFormOpen = !isEventFormOpen"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-inset transition-colors"
      >
        <h2 class="led-display text-[20px] flex items-center gap-2 m-0">
          Create event
        </h2>
        <div
          class="w-8 h-8 rounded-[2px] bg-inset flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isEventFormOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-ink"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-if="isEventFormOpen">
          <div class="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-rule mt-2">
            <form @submit.prevent="handleCreateEvent" class="space-y-6 pt-4">
              <div class="space-y-2">
                <label class="text-xs font-semibold text-muted font-sans"
                  >Event name</label
                >
                <input
                  v-model="newEvent.name"
                  type="text"
                  placeholder="e.g. Sunday Service"
                  required
                  class="w-full border border-rule-strong text-xs md:text-sm py-3 px-4 mt-2 text-ink font-sans transition-colors duration-200 placeholder:text-muted focus-visible:border-chapel"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-muted font-sans"
                  >Date</label
                >
                <input
                  v-model="newEvent.date"
                  type="date"
                  required
                  class="w-full border border-rule-strong text-xs md:text-sm py-3 px-4 mt-2 text-ink font-sans transition-colors duration-200 focus-visible:border-chapel"
                />
              </div>
              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingEvent"
                  class="w-full bg-chapel text-white font-semibold font-sans py-4 hover:bg-chapel-strong transition-colors duration-200 active:scale-[0.99] flex justify-center items-center gap-2 text-xs md:text-sm disabled:opacity-50"
                >
                  {{ isCreatingEvent ? "Creating…" : "Create event" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </section>

    <section
      v-if="showUserSection"
      class="bg-white rounded-none border border-rule transition-colors duration-200 overflow-hidden"
    >
      <button
        @click="isUserFormOpen = !isUserFormOpen"
        class="w-full p-6 sm:p-8 flex justify-between items-center bg-white hover:bg-inset transition-colors"
      >
        <h2 class="led-display text-[20px] flex items-center gap-2 m-0">
          Add user
        </h2>
        <div
          class="w-8 h-8 rounded-[2px] bg-inset flex items-center justify-center transition-transform duration-300"
          :class="{ 'rotate-180': isUserFormOpen }"
        >
          <Icon
            name="material-symbols:keyboard-arrow-down"
            class="text-xl text-ink"
          />
        </div>
      </button>

      <Transition name="accordion">
        <div v-if="isUserFormOpen">
          <div class="px-6 pb-6 sm:px-8 sm:pb-8 pt-8 border-t border-rule mt-2">
            <form
              @submit.prevent="handleCreateUser"
              class="space-y-6 animate-fade-in"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-semibold text-muted font-sans"
                    >Email</label
                  >
                  <div
                    class="flex items-center gap-1.5 px-2 py-0.5 bg-inset rounded-[2px] text-muted"
                  >
                    <Icon
                      name="material-symbols:info-outline"
                      class="text-xs"
                    />
                    <span class="text-xs font-medium">Lowercase only</span>
                  </div>
                </div>

                <div class="relative">
                  <input
                    v-model="newUser.email"
                    @input="handleEmailInput"
                    type="email"
                    placeholder="e.g. blessing@gmail.com"
                    required
                    class="w-full border border-rule-strong py-3 pl-4 pr-10 mt-2 text-ink font-sans transition-colors duration-200 placeholder:text-muted focus-visible:border-chapel text-xs md:text-sm"
                    :class="
                      emailStatus === 'taken' || emailStatus === 'invalid'
                        ? 'border-status-error focus:border-red-600 bg-[#fdf0ef]/30'
                        : 'border-rule-strong'
                    "
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 mt-1">
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
                <div class="h-4" v-if="emailStatus === 'taken'">
                  <p class="text-xs text-status-error font-semibold font-sans">
                    This email is already taken.
                  </p>
                </div>
                <div class="h-4" v-if="emailStatus === 'invalid'">
                  <p class="text-xs text-status-error font-semibold font-sans">
                    Please enter a valid email address.
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-muted font-sans"
                    >First name
                  </label>
                  <input
                    v-model="newUser.first_name"
                    type="text"
                    placeholder="Peter"
                    class="w-full border border-rule-strong py-3 px-4 mt-2 text-ink font-sans focus-visible:border-chapel text-xs md:text-sm"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-muted font-sans"
                    >Last name
                  </label>
                  <input
                    v-model="newUser.last_name"
                    type="text"
                    placeholder="Okodugha"
                    class="w-full border border-rule-strong py-3 px-4 mt-2 text-ink font-sans focus-visible:border-chapel text-xs md:text-sm"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-semibold text-muted font-sans"
                    >Password</label
                  >
                </div>
                <div class="relative group">
                  <div
                    class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted"
                  >
                    <Icon name="material-symbols:lock" class="text-lg" />
                  </div>
                  <input
                    v-model="newUser.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    required
                    class="w-full border border-rule-strong py-3 pl-11 pr-12 text-ink font-sans transition-colors duration-200 placeholder:text-muted focus-visible:border-chapel text-xs md:text-sm"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    :aria-label="
                      showPassword ? 'Hide password' : 'Show password'
                    "
                    :aria-pressed="showPassword"
                    class="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-ink"
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
                  <label class="text-xs font-semibold text-muted font-sans"
                    >Role</label
                  >
                  <select
                    v-model="newUser.role"
                    class="w-full border border-rule-strong mt-1 py-3 px-4 text-ink font-sans transition-colors duration-200 bg-white focus-visible:border-chapel text-xs md:text-sm"
                  >
                    <option value="USHER" class="text-xs md:text-sm">
                      Usher (Scanner Only)
                    </option>
                    <option value="SUPER_ADMIN" class="text-xs md:text-sm">
                      Super Admin (Full Access)
                    </option>
                  </select>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-semibold text-muted font-sans"
                    >Assigned unit</label
                  >
                  <select
                    v-model="newUser.unit"
                    required
                    class="w-full border border-rule-strong mt-1 py-3 px-4 text-ink font-sans transition-colors duration-200 bg-white focus-visible:border-chapel text-xs md:text-sm"
                  >
                    <option value="USHER" class="text-xs md:text-sm">
                      Usher
                    </option>
                    <option value="DRAMA" class="text-xs md:text-sm">
                      Drama
                    </option>
                    <option value="MEDIA" class="text-xs md:text-sm">
                      Media
                    </option>
                    <option value="CHOIR" class="text-xs md:text-sm">
                      Choir
                    </option>
                    <option value="TECHNICAL" class="text-xs md:text-sm">
                      Technical
                    </option>
                    <option value="ACADEMIC" class="text-xs md:text-sm">
                      Academic
                    </option>
                    <option value="BIBLE_STUDY" class="text-xs md:text-sm">
                      Bible Study
                    </option>
                    <option value="BROTHERS" class="text-xs md:text-sm">
                      Brothers
                    </option>
                    <option value="EVANGELISM" class="text-xs md:text-sm">
                      Evangelism
                    </option>
                    <option value="PRAYER" class="text-xs md:text-sm">
                      Prayer
                    </option>
                    <option value="PROTOCOL" class="text-xs md:text-sm">
                      Protocol
                    </option>
                    <option value="SISTERS" class="text-xs md:text-sm">
                      Sisters
                    </option>
                    <option value="WELFARE" class="text-xs md:text-sm">
                      Welfare
                    </option>
                    <option value="EDITORIAL" class="text-xs md:text-sm">
                      Editorial
                    </option>
                    <option value="OTHER" class="text-xs md:text-sm">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              <div class="pt-2">
                <button
                  type="submit"
                  :disabled="isCreatingUser || emailStatus !== 'available'"
                  class="w-full bg-chapel text-white font-semibold font-sans py-4 hover:bg-chapel-strong transition-colors duration-200 active:scale-[0.99] flex justify-center items-center gap-2 text-xs md:text-sm disabled:opacity-50"
                >
                  {{ isCreatingUser ? "Adding…" : "Add user" }}
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
import { ref, computed } from "vue";
import { useAdmin } from "~/composables/useAdmin";
import { useAppToast } from "~/composables/useAppToast"; // Added for safety alerts

const props = defineProps({
  section: {
    type: String,
    default: "all",
    validator: (value) => ["all", "event", "user"].includes(value),
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
});

const { checkAvailability } = useAdmin();
const toast = useAppToast();
const emit = defineEmits(["eventCreated", "userCreated"]);

const showEventSection = computed(() => props.section !== "user");
const showUserSection = computed(() => props.section !== "event");

const isEventFormOpen = ref(props.defaultOpen);
const isUserFormOpen = ref(props.defaultOpen);

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

  if (!newUser.value.password || /\s/.test(newUser.value.password)) {
    toast.error(
      "Password is required and cannot contain spaces or whitespace.",
    );
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
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
