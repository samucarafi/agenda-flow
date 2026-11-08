import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { getOwnerEntitlement } from "@/lib/subscription";

export async function getOwnedBusiness(businessId: string) {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    return null;
  }

  if (!mongoose.isValidObjectId(businessId)) {
    return null;
  }

  await connectToDatabase();

  const entitlement = await getOwnerEntitlement(user.id, user.email);
  if (!entitlement.unlimited && entitlement.businessLimit < 1) return null;

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  })
    .select(
      "_id ownerId name slug category status timezone theme bookingSettings availability",
    )
    .lean();

  if (!business) {
    return null;
  }

  return {
    user,
    business,
  };
}
