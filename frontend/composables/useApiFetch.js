// frontend/composables/useApiFetch.js
import { useCookie, useRuntimeConfig, navigateTo } from "#app";

// Per-attempt ceiling: long enough for slow mobile networks, short enough that
// a dead connection can never leave a sync lock stuck indefinitely.
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_MAX_DELAY_MS = 4_000;

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getStatusCode = (error) =>
  error?.statusCode ?? error?.response?.status ?? error?.status;

const isRetryableStatus = (status) =>
  status === 0 ||
  status === 408 ||
  status === 425 ||
  status === 429 ||
  status >= 500;

const isRetryableError = (error, timedOut) => {
  if (timedOut) return true;

  const status = getStatusCode(error);

  // No HTTP status means the request never reached / completed a response
  // (connection reset, DNS failure, etc.), which is safe to retry for
  // idempotent requests.
  if (typeof status !== "number") return true;

  return isRetryableStatus(status);
};

const createTimeoutError = (timeoutMs, cause) => {
  const error = new Error(`Request timed out after ${timeoutMs}ms.`);
  error.name = "TimeoutError";
  error.statusCode = 408;
  error.isTimeout = true;
  if (cause) error.cause = cause;
  return error;
};

const createAbortError = () => {
  const error = new Error("Request aborted.");
  error.name = "AbortError";
  return error;
};

const toNonNegativeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizeRetryPolicy = (retry, method) => {
  // Non-GET requests are never retried unless the caller explicitly opts in
  // (e.g. the idempotent bulk-sync endpoint).
  const defaults = {
    retries: method === "GET" ? DEFAULT_RETRY_ATTEMPTS : 0,
    baseDelay: DEFAULT_RETRY_BASE_DELAY_MS,
    maxDelay: DEFAULT_RETRY_MAX_DELAY_MS,
  };

  if (retry === false || retry === null) {
    return { ...defaults, retries: 0 };
  }

  if (retry === true) {
    return { ...defaults, retries: DEFAULT_RETRY_ATTEMPTS };
  }

  if (typeof retry === "number") {
    return {
      ...defaults,
      retries: Math.floor(toNonNegativeNumber(retry, defaults.retries)),
    };
  }

  if (retry && typeof retry === "object") {
    return {
      retries: Math.floor(
        toNonNegativeNumber(retry.retries, defaults.retries),
      ),
      baseDelay: toNonNegativeNumber(
        retry.baseDelay,
        defaults.baseDelay,
      ),
      maxDelay: toNonNegativeNumber(retry.maxDelay, defaults.maxDelay),
    };
  }

  return defaults;
};

// Full-jitter exponential backoff. The random component prevents a fleet of
// clients from retrying in lockstep after an outage.
const getRetryDelay = (attempt, policy) => {
  const ceiling = Math.min(
    policy.maxDelay,
    policy.baseDelay * 2 ** attempt,
  );

  if (ceiling <= 0) return 0;

  const half = ceiling / 2;
  return Math.round(half + Math.random() * half);
};

export const useApiFetch = async (request, opts = {}) => {
  const config = useRuntimeConfig();
  const token = useCookie("auth_token");
  const user = useCookie("auth_user");

  const {
    retry,
    timeout = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    onResponseError,
    ...fetchOptions
  } = opts;

  const method = (fetchOptions.method || "GET").toUpperCase();
  const retryPolicy = normalizeRetryPolicy(retry, method);
  const timeoutMs =
    Number.isFinite(Number(timeout)) && Number(timeout) > 0
      ? Number(timeout)
      : DEFAULT_TIMEOUT_MS;

  let lastError;

  for (let attempt = 0; attempt <= retryPolicy.retries; attempt += 1) {
    if (externalSignal?.aborted) {
      throw createAbortError();
    }

    const controller = new AbortController();
    let timedOut = false;
    let abortListener = null;

    if (externalSignal) {
      abortListener = () => controller.abort();
      externalSignal.addEventListener("abort", abortListener, { once: true });
    }

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    let attemptError = null;

    try {
      return await $fetch(request, {
        baseURL: config.public.apiBase,
        ...fetchOptions,
        headers: {
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...fetchOptions.headers,
        },
        signal: controller.signal,

        // Intercept auth failures globally, then delegate to any caller
        // supplied handler.
        async onResponseError(context) {
          const { response } = context;

          if (response.status === 401) {
            token.value = null;
            user.value = null;
            await navigateTo("/login", { replace: true });
          }

          if (typeof onResponseError === "function") {
            await onResponseError(context);
          }
        },
      });
    } catch (error) {
      attemptError = timedOut
        ? createTimeoutError(timeoutMs, error)
        : error;
    } finally {
      clearTimeout(timeoutId);

      if (externalSignal && abortListener) {
        externalSignal.removeEventListener("abort", abortListener);
      }
    }

    lastError = attemptError;

    const canRetry =
      attempt < retryPolicy.retries &&
      !externalSignal?.aborted &&
      isRetryableError(attemptError, timedOut);

    if (!canRetry) {
      throw attemptError;
    }

    await sleep(getRetryDelay(attempt, retryPolicy));

    if (externalSignal?.aborted) {
      throw createAbortError();
    }
  }

  throw lastError;
};
