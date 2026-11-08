import mongoose, { Schema, models, type Model } from "mongoose";

export const NOTIFICATION_TYPES = [
  "appointment_confirmed",
  "appointment_requested",
  "appointment_cancelled",
  "appointment_reminder",
  "new_appointment",
  "waitlist_called",
  "new_waitlist_entry",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification {
  userId: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", default: null, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, maxlength: 300 },
    href: { type: String, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification =
  (models.Notification as Model<INotification> | undefined) ??
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
