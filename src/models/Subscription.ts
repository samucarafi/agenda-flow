import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SubscriptionStatus = "trialing" | "pending_payment" | "active" | "cancelled" | "expired" | "past_due";
export type BillingInterval = "month" | "year";

export interface ISubscription extends Document {
  ownerId: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  trialStartedAt: Date;
  trialEndsAt: Date;
  trialUsedAt: Date;
  billingInterval?: BillingInterval;
  amountCents?: number;
  additionalBusinesses: number;
  cancelledAt?: Date;
  currentPeriodEndsAt?: Date;
  provider: "mercado_pago" | "none";
  providerSubscriptionId?: string;
  pendingBillingInterval?: BillingInterval;
  pendingAdditionalBusinesses?: number;
  pendingAmountCents?: number;
  lastWebhookAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  status: { type: String, enum: ["trialing", "pending_payment", "active", "cancelled", "expired", "past_due"], required: true, default: "trialing", index: true },
  trialStartedAt: { type: Date, required: true },
  trialEndsAt: { type: Date, required: true, index: true },
  trialUsedAt: { type: Date, required: true },
  billingInterval: { type: String, enum: ["month", "year"] },
  amountCents: { type: Number, min: 0 },
  additionalBusinesses: { type: Number, min: 0, default: 0 },
  cancelledAt: { type: Date },
  currentPeriodEndsAt: { type: Date, index: true },
  provider: { type: String, enum: ["mercado_pago", "none"], default: "none", required: true },
  providerSubscriptionId: { type: String, trim: true, maxlength: 120 },
  pendingBillingInterval: { type: String, enum: ["month", "year"] },
  pendingAdditionalBusinesses: { type: Number, min: 0 },
  pendingAmountCents: { type: Number, min: 0 },
  lastWebhookAt: { type: Date },
}, { timestamps: true });

const Subscription = (mongoose.models.Subscription as Model<ISubscription> | undefined) ?? mongoose.model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;
