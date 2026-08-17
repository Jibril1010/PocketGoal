import webpush from "web-push";
import { env } from "./env.js";

export const webPushConfigured = Boolean(env.vapidPublicKey && env.vapidPrivateKey);

if (webPushConfigured) {
  webpush.setVapidDetails(env.vapidContactEmail, env.vapidPublicKey, env.vapidPrivateKey);
} else {
  console.warn("VAPID keys not set — push notifications are disabled. See backend/.env.example.");
}

export { webpush };
