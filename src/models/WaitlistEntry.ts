import mongoose, { Schema, models, type Model } from "mongoose";

export const WAITLIST_STATUSES = [
  "waiting",
  "called",
  "seated",
  "cancelled",
  "no_show",
] as const;

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export interface IWaitlistEntry {
  userId?: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  customerName: string;
  phone?: string;
  partySize: number;
  status: WaitlistStatus;
  position: number;
  tableId?: mongoose.Types.ObjectId;
  notes?: string;
  joinedAt: Date;
  calledAt?: Date;
  seatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistEntrySchema = new Schema<IWaitlistEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 40,
      validate: Number.isInteger,
    },
    status: {
      type: String,
      enum: WAITLIST_STATUSES,
      default: "waiting",
      required: true,
      index: true,
    },
    position: { type: Number, required: true, min: 1 },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: undefined,
    },
    notes: { type: String, trim: true, maxlength: 300, default: "" },
    joinedAt: { type: Date, default: Date.now, required: true, index: true },
    calledAt: { type: Date, default: undefined },
    seatedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

waitlistEntrySchema.index({ businessId: 1, status: 1, joinedAt: 1 });

const WaitlistEntry =
  (models.WaitlistEntry as Model<IWaitlistEntry> | undefined) ??
  mongoose.model<IWaitlistEntry>("WaitlistEntry", waitlistEntrySchema);

export default WaitlistEntry;
