// Single source of truth for status language. Presentation components should
// ask for a status tone instead of inventing another green/orange/red palette.
const TONES = {
  draft: {
    label: "Draft",
    badgeClass: "status-draft",
    dotClass: "bg-status-draft",
  },
  in: {
    label: "In",
    badgeClass: "status-live",
    dotClass: "bg-status-live",
  },
  syncing: {
    label: "Syncing",
    badgeClass: "status-syncing",
    dotClass: "bg-status-syncing",
  },
  out: {
    label: "Out",
    badgeClass: "status-locked",
    dotClass: "bg-status-locked",
  },
  archived: {
    label: "Archived",
    badgeClass: "status-archived",
    dotClass: "bg-status-archived",
  },
  error: {
    label: "Error",
    badgeClass: "status-error",
    dotClass: "bg-status-error",
  },
  info: {
    label: "Info",
    badgeClass: "status-info",
    dotClass: "bg-status-info",
  },
};

const EVENT_STATUS_TONES = {
  DRAFT: "draft",
  SIGN_IN_ACTIVE: "in",
  SYNCING_PHASE: "syncing",
  SIGN_OUT_ACTIVE: "out",
  ARCHIVED: "archived",
};

// Keep this in sync with backend/routes/events.js.
export const EVENT_STATUS_TRANSITIONS = {
  UPCOMING: ["SIGN_IN_ACTIVE", "ARCHIVED"],
  SIGN_IN_ACTIVE: ["SYNCING_PHASE", "SIGN_OUT_ACTIVE", "ARCHIVED"],
  SYNCING_PHASE: ["SIGN_IN_ACTIVE", "SIGN_OUT_ACTIVE", "ARCHIVED"],
  SIGN_OUT_ACTIVE: ["SIGN_IN_ACTIVE", "SYNCING_PHASE", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export const canTransitionEventStatus = (fromStatus, toStatus) =>
  (EVENT_STATUS_TRANSITIONS[fromStatus] || []).includes(toStatus);

const humanize = (value) =>
  String(value || "")
    .replace(/_ACTIVE/g, "")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

export const getTone = (tone) => TONES[tone] || TONES.info;

export const getEventStatus = (status) => {
  const tone = EVENT_STATUS_TONES[status] || "info";

  return {
    ...TONES[tone],
    label: EVENT_STATUS_TONES[status] ? TONES[tone].label : humanize(status),
  };
};
