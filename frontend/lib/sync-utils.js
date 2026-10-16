/**
 * Cross-tab and in-app real-time synchronization utilities
 */

export function broadcastSyncEvent(payload) {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("coachmaster_sync");
      channel.postMessage(payload);
      channel.close();
    }
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("coachmaster_sync_event", Date.now().toString());
    }
  } catch (_) {}
}

export const DASHBOARD_CACHE_KEY = "coachmaster_dashboard_cache_v2";
