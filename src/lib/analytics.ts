// Swap this later with your real analytics SDK
export const analytics = {
  track(event: string, props?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", event, props ?? {});
    }
  }
};
