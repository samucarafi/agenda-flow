import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import { connectToDatabase } from "@/lib/mongodb";
import PushDevice from "@/models/PushDevice";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
  type?: string;
};

function getFirebaseApp() {
  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) return null;

  try {
    const credentials = JSON.parse(rawCredentials);
    const existing = getApps().find((app) => app.name === "agendaflow-push");

    return existing ?? initializeApp(
      { credential: cert(credentials) },
      "agendaflow-push",
    );
  } catch (error) {
    console.error("Credenciais Firebase inválidas:", error);
    return null;
  }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const app = getFirebaseApp();
  if (!app) return { sent: 0, skipped: true };

  await connectToDatabase();

  const devices = await PushDevice.find({
    userId,
    active: true,
  })
    .select("+token")
    .limit(500)
    .lean();

  if (devices.length === 0) return { sent: 0, skipped: false };

  const response = await getMessaging(app).sendEachForMulticast({
    tokens: devices.map((device) => device.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      href: payload.href ?? "/",
      type: payload.type ?? "system",
    },
    android: {
      priority: "high",
      notification: {
        channelId: "agendaflow-updates",
      },
    },
  });

  const invalidTokens = response.responses
    .map((result, index) => ({
      result,
      token: devices[index]?.token,
    }))
    .filter(({ result }) =>
      !result.success &&
      ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(
        result.error?.code ?? "",
      ),
    )
    .map(({ token }) => token)
    .filter((token): token is string => Boolean(token));

  if (invalidTokens.length) {
    await PushDevice.updateMany(
      { token: { $in: invalidTokens } },
      { $set: { active: false } },
    );
  }

  return {
    sent: response.successCount,
    failed: response.failureCount,
    skipped: false,
  };
}
