import type { CapacitorConfig } from "@capacitor/cli";

const configuredUrl =
  process.env.CAPACITOR_SERVER_URL ?? process.env.NEXT_PUBLIC_APP_URL;

let server: CapacitorConfig["server"];

if (configuredUrl) {
  const parsedUrl = new URL(configuredUrl);

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.hostname !== "localhost" &&
    parsedUrl.hostname !== "127.0.0.1"
  ) {
    throw new Error("CAPACITOR_SERVER_URL precisa usar HTTPS.");
  }

  server = {
    url: parsedUrl.origin,
    cleartext: parsedUrl.protocol === "http:",
  };
}

const config: CapacitorConfig = {
  appId: "com.agendaflow.app",
  appName: "AgendaFlow",
  webDir: "mobile-shell",
  ...(server ? { server } : {}),
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
