"use server";

import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function getMyNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  await connectToDatabase();

  const notifications = await Notification.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return notifications.map((item) => ({
    id: item._id.toString(),
    title: item.title,
    body: item.body,
    type: item.type,
    href: item.href ?? "/",
    read: Boolean(item.readAt),
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();

  if (!user || !mongoose.isValidObjectId(notificationId)) {
    return { success: false };
  }

  await connectToDatabase();

  const result = await Notification.updateOne(
    { _id: notificationId, userId: user.id, readAt: null },
    { $set: { readAt: new Date() } },
  );

  return { success: result.modifiedCount > 0 };
}
