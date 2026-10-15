import mongoose from "mongoose";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";

export async function getOwnedBusiness(businessId: string) {
  const user = await getCurrentUser();

  if (!user || user.role !== "owner") {
    return null;
  }

  if (!mongoose.isValidObjectId(businessId)) {
    return null;
  }

  await connectToDatabase();

  const business = await Business.findOne({
    _id: businessId,
    ownerId: user.id,
  })
    .select(
      "_id ownerId name slug category status timezone theme bookingSettings",
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
