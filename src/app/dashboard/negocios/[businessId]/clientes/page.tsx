import mongoose from "mongoose";
import { notFound } from "next/navigation";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Client from "@/models/Client";
import User from "@/models/User";
import WaitlistEntry from "@/models/WaitlistEntry";
import { ClientsPage } from "@/components/dashboard/ClientsPage";

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function BusinessClientsRoute({ params }: PageProps) {
  const { businessId } = await params;
  const access = await getOwnedBusiness(businessId);

  if (!access) notFound();

  await connectToDatabase();

  // Migra de forma idempotente os clientes que já existiam na fila antes
  // da unificação da área Clientes do restaurante.
  if (access.business.category === "restaurant") {
    const legacyEntries = await WaitlistEntry.find({
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .sort({ joinedAt: -1 })
      .limit(1000)
      .select("userId customerName phone")
      .lean();

    const linkedLegacyEntries = legacyEntries.filter(
      (entry) => Boolean(entry.userId),
    );
    const legacyUserIds = [...new Set(
      linkedLegacyEntries.map((entry) => entry.userId!.toString()),
    )];

    if (legacyUserIds.length) {
      const [legacyUsers, existingProfiles] = await Promise.all([
        User.find({
          _id: { $in: legacyUserIds },
          role: "client",
        }).select("_id email name").lean(),
        Client.find({ businessId }).select("email accountUserId").lean(),
      ]);

      const profileByEmail = new Map(
        existingProfiles.map((profile) => [profile.email, profile]),
      );
      const userById = new Map(
        legacyUsers.map((user) => [user._id.toString(), user]),
      );
      const latestEntryByUser = new Map<string, (typeof linkedLegacyEntries)[number]>();

      for (const entry of linkedLegacyEntries) {
        const userId = entry.userId!.toString();
        if (!latestEntryByUser.has(userId)) latestEntryByUser.set(userId, entry);
      }

      const profileOperations = [...latestEntryByUser.entries()].flatMap(
        ([userId, entry]) => {
          const user = userById.get(userId);
          if (!user) return [];

          const existingProfile = profileByEmail.get(user.email);
          if (existingProfile?.accountUserId?.toString() === userId) return [];

          return [{
            updateOne: {
              filter: { businessId: new mongoose.Types.ObjectId(businessId), email: user.email },
              update: {
                $set: {
                  accountUserId: user._id,
                  name: entry.customerName,
                  email: user.email,
                  phone: entry.phone ?? "",
                  active: true,
                },
              },
              upsert: true,
            },
          }];
        },
      );

      if (profileOperations.length) {
        await Client.bulkWrite(profileOperations, { ordered: false }).catch((error) => {
          // Uma criação simultânea pode disputar o índice único por negócio/e-mail.
          if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) {
            console.error("Falha ao migrar clientes antigos da fila:", error);
          }
        });
      }
    }
  }

  const clients = await Client.find({ businessId, active: true })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = clients
    .map((client) => client.accountUserId?.toString())
    .filter((id): id is string => Boolean(id));

  const users = userIds.length
    ? await User.find({ _id: { $in: userIds }, active: true })
        .select("_id mustChangePassword")
        .lean()
    : [];

  const usersById = new Map(
    users.map((user) => [user._id.toString(), user]),
  );

  const serializedClients = clients.map((client) => {
    const accountUserId = client.accountUserId?.toString();
    const account = accountUserId ? usersById.get(accountUserId) : undefined;

    return {
      _id: client._id.toString(),
      name: client.name,
      email: client.email,
      phone: client.phone,
      active: client.active,
      createdAt: client.createdAt.toISOString(),
      hasAccount: Boolean(account),
      mustChangePassword: account?.mustChangePassword ?? false,
    };
  });

  return <ClientsPage businessId={businessId} clients={serializedClients} />;
}
