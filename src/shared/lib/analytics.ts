import posthog from "posthog-js";

function ready(): boolean {
  return typeof window !== "undefined" && typeof posthog?.capture === "function";
}

export const analytics = {
  capture(event: string, properties?: Record<string, unknown>): void {
    if (!ready()) return;
    posthog.capture(event, properties);
  },

  captureException(err: unknown): void {
    if (!ready()) return;
    posthog.captureException(err instanceof Error ? err : new Error(String(err)));
  },

  identify(userId: string, properties?: Record<string, unknown>): void {
    if (!ready()) return;
    posthog.identify(userId, properties);
  },
};
