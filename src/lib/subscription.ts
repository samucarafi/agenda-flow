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
  if (subscription.status === "trialing" && subscription.trialEndsAt.getTime() <= Date.now()) {
    subscription.status = "expired";
    await subscription.save();
  }
  const active = subscription.status === "active" || (subscription.status === "trialing" && subscription.trialEndsAt.getTime() > Date.now());
  return {
    unlimited: false,
    status: subscription.status,
    businessLimit: active ? 1 + (subscription.status === "active" ? subscription.additionalBusinesses : 0) : 0,
  };
}

export async function countOwnerBusinesses(userId: string) {
  await connectToDatabase();
  return Business.countDocuments({ ownerId: userId });
}
