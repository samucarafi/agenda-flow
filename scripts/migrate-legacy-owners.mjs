import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
const cutoff = process.env.LEGACY_OWNER_CUTOFF;
if (!uri || !cutoff || Number.isNaN(Date.parse(cutoff))) {
  console.error("Defina MONGODB_URI e LEGACY_OWNER_CUTOFF (data ISO anterior ao deploy).");
  process.exit(1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const users = db.collection("users");
const businesses = db.collection("businesses");
const owners = await users.find({
  role: "owner",
  active: { $ne: false },
  createdAt: { $lte: new Date(cutoff) },
}, { projection: { _id: 1 } }).toArray();

let migrated = 0;
for (const owner of owners) {
  const count = await businesses.countDocuments({ ownerId: owner._id });
  if (count > 0) {
    const result = await users.updateOne(
      { _id: owner._id, legacyUnlimited: { $ne: true } },
      { $set: { legacyUnlimited: true } },
    );
    migrated += result.modifiedCount;
  }
}
console.log(`Migração concluída: ${migrated} proprietário(s) antigo(s) com negócios receberam acesso legado ilimitado.`);
await mongoose.disconnect();
