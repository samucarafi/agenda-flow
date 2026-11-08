import mongoose, { Schema, models, type Model } from "mongoose";

export type PushPlatform = "android" | "ios";

export interface IPushDevice {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: PushPlatform;
  active: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pushDeviceSchema = new Schema<IPushDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      select: false,
      maxlength: 4096,
    },
    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

pushDeviceSchema.index({ token: 1 }, { unique: true });
pushDeviceSchema.index({ userId: 1, active: 1 });

const PushDevice =
  (models.PushDevice as Model<IPushDevice> | undefined) ??
  mongoose.model<IPushDevice>("PushDevice", pushDeviceSchema);

export default PushDevice;
