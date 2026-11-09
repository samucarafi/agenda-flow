import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Business from "@/models/Business";
import Subscription from "@/models/Subscription";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export async function hasUnlimitedOwnerAccess(userId: string, email: string) {
  if (ADMIN_EMAILS.has(email.toLowerCase())) return true;
  await connectToDatabase();
  const user = await User.findById(userId).select("legacyUnlimited role").lean();
  return Boolean(user?.role === "owner" && user.legacyUnlimited);
}

export async function getOwnerEntitlement(userId: string, email: string) {
  await connectToDatabase();
  if (await hasUnlimitedOwnerAccess(userId, email)) {
    return { unlimited: true, status: "legacy_unlimited" as const, businessLimit: Number.POSITIVE_INFINITY };
  }

  const subscription = await Subscription.findOne({ ownerId: userId });
  if (!subscription) return { unlimited: false, status: "missing" as const, businessLimit: 0 };

  const now = Date.now();
  const trialStillValid = subscription.trialEndsAt.getTime() > now;
  const hasPaidPlan = Boolean(subscription.billingInterval && typeof subscription.amountCents === "number");

  // Recupera contas cujo teste foi marcado como cancelado por engano ao cancelar
  // um checkout pendente durante os 30 dias gratuitos. Não restaura planos pagos.
  if (subscription.status === "cancelled" && trialStillValid && !hasPaidPlan) {
    subscription.status = "trialing";
    subscription.providerSubscriptionId = undefined;
    subscription.pendingBillingInterval = undefined;
    subscription.pendingAdditionalBusinesses = undefined;
    subscription.pendingAmountCents = undefined;
    subscription.cancelledAt = undefined;
    await subscription.save();
  }

  if (subscription.status === "trialing" && !trialStillValid) {
    subscription.status = "expired";
    await subscription.save();
  }

  // A próxima cobrança informada pelo Mercado Pago delimita o período pago atual.
  if (subscription.status === "active" && subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt.getTime() <= now) {
    subscription.status = "expired";
    await subscription.save();
  }

  const paidPeriodStillValid = hasPaidPlan
    && Boolean(subscription.currentPeriodEndsAt)
    && subscription.currentPeriodEndsAt!.getTime() > now
    && subscription.status === "cancelled";
  const active = subscription.status === "active"
    || (subscription.status === "trialing" && trialStillValid)
    || paidPeriodStillValid;
  return {
    unlimited: false,
    status: subscription.status,
    businessLimit: active ? 1 + (hasPaidPlan ? subscription.additionalBusinesses : 0) : 0,
  };
}

export async function countOwnerBusinesses(userId: string) {
  await connectToDatabase();
  return Business.countDocuments({ ownerId: userId });
}
