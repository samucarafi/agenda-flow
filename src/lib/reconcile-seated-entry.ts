import mongoose from "mongoose";
import RestaurantTable from "@/models/RestaurantTable";
import WaitlistEntry, { type WaitlistStatus } from "@/models/WaitlistEntry";

type PopulatedId = mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } | null | undefined;

type SeatedEntryLike = {
  _id: mongoose.Types.ObjectId;
  businessId: PopulatedId;
  tableId?: PopulatedId;
  status: WaitlistStatus;
  completedAt?: Date;
};

function objectId(value: PopulatedId) {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return value._id;
}

/** Repairs old seated entries that no longer own an occupied table. */
export async function reconcileSeatedEntry(entry: SeatedEntryLike): Promise<WaitlistStatus> {
  if (entry.status !== "seated") return entry.status;

  const businessId = objectId(entry.businessId);
  const tableId = objectId(entry.tableId);
  const table = businessId && tableId
    ? await RestaurantTable.findOne({
        _id: tableId,
        businessId,
        active: true,
        status: "occupied",
      }).select("_id occupiedEntryId").lean()
    : null;

  const explicitlyAssociated = table?.occupiedEntryId?.equals(entry._id) ?? false;
  const hasLegacyAssociation = Boolean(
    table &&
      !table.occupiedEntryId &&
      businessId &&
      tableId &&
      (await WaitlistEntry.countDocuments({
        businessId,
        tableId,
        status: { $in: ["seated", "completed"] },
      })) === 1,
  );

  if (explicitlyAssociated || hasLegacyAssociation) return "seated";

  const completed = await WaitlistEntry.findOneAndUpdate(
    {
      _id: entry._id,
      status: "seated",
      ...(businessId ? { businessId } : {}),
      ...(tableId
        ? { tableId }
        : { $or: [{ tableId: null }, { tableId: { $exists: false } }] }),
    },
    {
      $set: { status: "completed", completedAt: entry.completedAt ?? new Date() },
      $unset: { activeUserKey: 1 },
    },
    { new: true },
  ).select("status").lean();

  if (completed) return completed.status;

  const current = await WaitlistEntry.findById(entry._id).select("status").lean();
  return current?.status ?? "completed";
}
