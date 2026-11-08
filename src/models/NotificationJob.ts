import mongoose, { Schema, models, type Model } from "mongoose";

export type NotificationJobStatus = "pending" | "processing" | "sent" | "cancelled" | "failed";

export interface INotificationJob {
  userId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  reminderKey: "24h" | "1h";
  title: string;
  body: string;
  href: string;
  scheduledAt: Date;
  status: NotificationJobStatus;
  attempts: number;
  processingAt?: Date | null;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationJobSchema = new Schema<INotificationJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    reminderKey: { type: String, enum: ["24h", "1h"], required: true },
    title: { type: String, required: true, maxlength: 100 },
    body: { type: String, required: true, maxlength: 300 },
    href: { type: String, required: true, maxlength: 500 },
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    processingAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationJobSchema.index(
  { appointmentId: 1, userId: 1, reminderKey: 1, scheduledAt: 1 },
  { unique: true },
);
notificationJobSchema.index({ status: 1, scheduledAt: 1 });

const NotificationJob =
  (models.NotificationJob as Model<INotificationJob> | undefined) ??
  mongoose.model<INotificationJob>("NotificationJob", notificationJobSchema);

export default NotificationJob;
