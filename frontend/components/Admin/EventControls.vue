<template>
  <div v-if="event" class="mt-8 animate-fade-in">
    <section
      class="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm relative overflow-hidden"
    >
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10"
      >
        <div>
          <h2 class="text-xl font-black font-poppins text-black">
            {{ event.name }}
          </h2>
          <p class="text-sm text-gray-500 font-medium mt-1">
            Current State:
            <span
              class="text-black font-bold uppercase tracking-wider text-xs bg-gray-100 px-2 py-0.5 rounded ml-1"
            >
              {{ event.status.replace("_ACTIVE", "").replace("_", " ") }}
            </span>
          </p>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button
            @click="handleStatus('ARCHIVED')"
            :disabled="event.status === 'ARCHIVED' || isUpdating"
            class="bg-gray-100 text-gray-700 border border-gray-200 shadow-sm px-4 py-2.5 rounded-xl font-bold font-poppins text-sm hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="material-symbols:archive" class="text-lg" />
            <span class="hidden sm:inline">Archive</span>
          </button>

          <button
            @click="handleDelete"
            :disabled="isDeleting"
            class="bg-red-50 text-red-600 border border-red-200 shadow-sm px-4 py-2.5 rounded-xl font-bold font-poppins text-sm hover:bg-red-100 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <Icon
              v-if="isDeleting"
              name="material-symbols:sync"
              class="text-lg animate-spin"
            />
            <Icon v-else name="material-symbols:delete" class="text-lg" />
            <span class="hidden sm:inline">Delete</span>
          </button>

          <a
            :href="`${config.public.apiBase}/events/${event.id}/export?token=${token}`"
            target="_blank"
            class="bg-white border border-gray-200 shadow-sm text-black px-5 py-2.5 rounded-xl font-bold font-poppins text-sm hover:border-black hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            <Icon name="material-symbols:download" class="text-lg" /> Export CSV
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <button
          @click="handleStatus('SIGN_IN_ACTIVE')"
          :disabled="event.status === 'SIGN_IN_ACTIVE' || isUpdating"
          class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-green-600 group-hover:bg-green-600 group-hover:text-white group-disabled:text-gray-400"
          >
            <Icon name="material-symbols:login" class="text-xl" />
          </div>
          <span
            class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
            >Sign In</span
          >
          <span
            class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
            >Entrance Mode</span
          >
        </button>

        <button
          @click="handleStatus('SYNCING_PHASE')"
          :disabled="event.status === 'SYNCING_PHASE' || isUpdating"
          class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-orange-600 group-hover:bg-orange-600 group-hover:text-white group-disabled:text-gray-400"
          >
            <Icon name="material-symbols:sync" class="text-xl" />
          </div>
          <span
            class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
            >Lock & Sync</span
          >
          <span
            class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
            >Cloud Handshake</span
          >
        </button>

        <button
          @click="handleStatus('SIGN_OUT_ACTIVE')"
          :disabled="event.status === 'SIGN_OUT_ACTIVE' || isUpdating"
          class="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all duration-200 group disabled:opacity-50"
        >
          <div
            class="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 transition-all duration-200 text-red-600 group-hover:bg-red-600 group-hover:text-white group-disabled:text-gray-400"
          >
            <Icon name="material-symbols:logout" class="text-xl" />
          </div>
          <span
            class="text-sm font-bold font-poppins uppercase tracking-widest text-black"
            >Sign Out</span
          >
          <span
            class="text-[0.65rem] text-gray-500 mt-1 font-medium uppercase tracking-wider"
            >Departure Mode</span
          >
        </button>
      </div>

      <div class="mt-8 pt-8 border-t border-gray-100 relative z-10">
        <h3
          class="text-sm font-black font-poppins text-black mb-4 flex items-center gap-2"
        >
          <Icon
            name="material-symbols:lock-person"
            class="text-lg text-gray-500"
          />
          Usher Access Code
        </h3>

        <div
          class="bg-gray-900 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 justify-between shadow-lg"
        >
          <div class="text-left text-white max-w-sm">
            <h4 class="font-bold font-poppins text-lg mb-2">
              Gatekeeper Active
            </h4>
            <p class="text-xs text-gray-400 leading-relaxed font-poppins mb-4">
              Ushers cannot access the scanner interface until they scan this QR
              code or manually enter the PIN below. Do not share this outside
              the venue.
            </p>
            <div
              class="inline-flex items-center gap-3 bg-black/50 border border-white/10 px-4 py-2 rounded-xl"
            >
              <span
                class="text-gray-400 text-xs font-bold uppercase tracking-widest"
                >Manual PIN:</span
              >
              <span
                class="font-black text-xl tracking-widest text-green-400 font-montserrat"
                >{{ event.unlock_pin }}</span
              >
            </div>
          </div>

          <div
            class="bg-white p-3 rounded-xl shrink-0 border-4 border-gray-800"
          >
            <img
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${event.unlock_pin}&margin=0`"
              alt="Unlock QR Code"
              class="w-32 h-32 rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRuntimeConfig, useCookie } from "#app";

const props = defineProps({
  event: Object,
});

const emit = defineEmits(["statusUpdated", "eventDeleted"]);

const config = useRuntimeConfig();
const token = useCookie("auth_token"); // Needed for the CSV Export link

const isUpdating = ref(false);
const isDeleting = ref(false);

const handleStatus = async (newStatus) => {
  isUpdating.value = true;
  emit("statusUpdated", props.event, newStatus, () => {
    isUpdating.value = false;
  });
};

const handleDelete = async () => {
  isDeleting.value = true;
  emit("eventDeleted", props.event.id, () => {
    isDeleting.value = false;
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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
