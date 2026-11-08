import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import Notification, { type NotificationType } from "@/models/Notification";
import { sendPushToUser } from "@/lib/push-notifications";

type NotifyInput = {
  userId: string;
  businessId?: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
};

export async function notifyUser(input: NotifyInput): Promise<boolean> {
  try {
    await connectToDatabase();

    await Notification.create({
      userId: new mongoose.Types.ObjectId(input.userId),
      ...(input.businessId && mongoose.isValidObjectId(input.businessId)
        ? { businessId: new mongoose.Types.ObjectId(input.businessId) }
        : {}),
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    });

    try {
      await sendPushToUser(input.userId, {
        title: input.title,
        body: input.body,
        href: input.href,
        type: input.type,
      });
    } catch (pushError) {
      // O registro na central in-app deve continuar mesmo se o push falhar.
      console.error("Falha ao enviar push AgendaFlow:", pushError);
    }
    return true;
  } catch (error) {
    // Notificações são complementares e não devem desfazer a operação principal.
    console.error("notifyUser:", error);
    return false;
  }
}
