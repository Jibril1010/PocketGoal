import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  // Comma-separated list, e.g. "http://localhost:5173,http://192.168.1.23:5173"
  // — lets the same backend serve both your desktop browser and your phone
  // on the LAN at once.
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").split(",").map((o) => o.trim()),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  geminiApiKey: required("GEMINI_API_KEY"),
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidContactEmail: process.env.VAPID_CONTACT_EMAIL ?? "mailto:admin@example.com",
};
