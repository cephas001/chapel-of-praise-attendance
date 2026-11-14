<template>
  <div class="min-h-screen bg-canvas pb-24 font-sans text-ink">
    <main class="mx-auto max-w-4xl px-5 pt-6 sm:px-8">
      <LedgerPageHeader eyebrow="messages" title="Inbox">
        <template #actions>
          <button
            type="button"
            @click="loadInbox"
            class="led-eyebrow inline-flex min-h-11 items-center gap-1.5 py-2 transition-colors hover:text-ink"
            aria-label="Refresh inbox"
          >
            <Icon name="material-symbols:refresh" class="text-base" />
            refresh
          </button>
        </template>
      </LedgerPageHeader>

      <div class="mt-8 max-w-3xl">
        <div v-if="inbox.length === 0" class="py-6">
          <p class="led-eyebrow">no messages</p>
          <h2 class="led-display mt-2 text-[28px]">You're all caught up.</h2>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Announcements from your admin will land here. Records and scans are
            unaffected.
          </p>
        </div>

        <div v-else class="border-t border-rule">
          <article
            v-for="message in inbox"
            :key="message.id"
            class="border-b border-rule py-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex min-w-0 items-start gap-3">
                <span
                  class="mt-2 h-1.5 w-1.5 shrink-0 rounded-[1px]"
                  :class="message.is_read ? 'bg-rule-strong' : 'bg-chapel'"
                ></span>
                <h3
                  class="text-[15px] font-semibold leading-snug"
                  :class="message.is_read ? 'text-muted' : 'text-ink'"
                >
                  {{ message.title }}
                </h3>
              </div>

              <p class="shrink-0 font-mono text-[11px] text-muted">
                {{
                  new Date(message.created_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })
                }}
              </p>
            </div>

            <p class="mt-2 pl-[1.125rem] text-sm leading-relaxed text-muted">
              {{ message.body }}
            </p>

            <div class="mt-3 flex items-center gap-5 pl-[1.125rem]">
              <button
                v-if="!message.is_read"
                type="button"
                @click="markAsRead(message.id)"
                class="inline-flex min-h-11 items-center font-mono text-[11px] text-chapel transition-colors hover:text-chapel-strong"
                :aria-label="`Mark message from ${message.sender_name || 'sender'} as read`"
              >
                mark as read
              </button>

              <button
                type="button"
                @click="deleteMessage(message.id)"
                class="inline-flex min-h-11 items-center font-mono text-[11px] text-muted transition-colors hover:text-status-error"
                :aria-label="`Delete message from ${message.sender_name || 'sender'}`"
              >
                delete
              </button>

              <span class="ml-auto font-mono text-[11px] text-muted">
                {{
                  new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              </span>
            </div>
          </article>

          <button
            v-if="inboxPagination.hasMore"
            type="button"
            @click="loadMoreInbox"
            class="flex min-h-11 w-full items-center justify-center border-b border-rule font-mono text-[11px] text-muted transition-colors hover:bg-inset hover:text-ink"
          >
            load older messages
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useMessages } from "~/composables/useMessages";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";

const {
  inbox,
  inboxPagination,
  loadInbox,
  loadMoreInbox,
  markAsRead,
  deleteMessage,
} = useMessages();
const { token } = useAuth();
const router = useRouter();

onMounted(() => {
  if (!token.value) return router.push("/login");
  loadInbox();
});
</script>
