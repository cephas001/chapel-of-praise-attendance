// frontend/composables/useAdmin.js
import { ref } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useToast } from "~/composables/useToast";

export const useAdmin = () => {
  const { user } = useAuth();
  const toast = useToast();

  const allEvents = ref([]);
  const isLoadingEvents = ref(false);

  const loadAllEvents = async () => {
    isLoadingEvents.value = true;
    try {
      allEvents.value = await useApiFetch("/events");
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      isLoadingEvents.value = false;
    }
  };

  const createEvent = async (eventData) => {
    try {
      const data = await useApiFetch("/events", {
        method: "POST",
        body: {
          ...eventData,
          created_by_id: user.value.id,
        },
      });
      toast.success("Event created successfully!");
      await loadAllEvents();
      return data.event; // Return the new event so the UI can select it
    } catch (error) {
      toast.error(error.data?.error || "Failed to create event");
      return null;
    }
  };

  const createUser = async (userData) => {
    try {
      await useApiFetch("/users", {
        method: "POST",
        body: userData,
      });
      toast.success("User registered successfully!");
      return true;
    } catch (error) {
      toast.error(`Failed: ${error.data?.message || "Could not create user"}`);
      return false;
    }
  };

  const deleteEvent = async (id) => {
    if (
      !confirm(
        "Are you ABSOLUTELY sure you want to delete this event? This action cannot be undone.",
      )
    )
      return false;

    try {
      await useApiFetch(`/events/${id}`, { method: "DELETE" });
      toast.success("Event deleted successfully!");
      await loadAllEvents();
      return true;
    } catch (error) {
      toast.error(error.data?.message || "Failed to delete event.");
      return false;
    }
  };

  const updateEventStatus = async (event, newStatus) => {
    if (!confirm(`Change ${event.name} phase to ${newStatus}?`)) return false;

    try {
      await useApiFetch(`/events/${event.id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });

      // Update local state to instantly reflect on the UI
      const index = allEvents.value.findIndex((e) => e.id === event.id);
      if (index !== -1) {
        allEvents.value[index].status = newStatus;
      }
      return true;
    } catch (error) {
      toast.error(error.data?.error || "Failed to update status");
      return false;
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.trim() === "") return null;

    try {
      const data = await useApiFetch(
        `/users/check?username=${encodeURIComponent(username)}`,
      );
      return data.available; // Returns true or false
    } catch (error) {
      toast.error("Failed to check username availability");
      return null;
    }
  };

  return {
    allEvents,
    isLoadingEvents,
    loadAllEvents,
    createEvent,
    createUser,
    deleteEvent,
    updateEventStatus,
    checkUsernameAvailability,
  };
};
