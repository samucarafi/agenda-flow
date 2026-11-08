import "server-only";

import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import BookingDayLock from "@/models/BookingDayLock";

const LOCK_LEASE_MS = 60_000;
const MAX_ATTEMPTS = 30;
let uniqueIndexPromise: Promise<string> | undefined;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Serializa gravações de agendamentos do mesmo negócio e dia.
 * A checagem de conflito e a criação/alteração devem acontecer dentro do callback.
 */
export async function withBookingDayLock<T>(
  businessId: string | mongoose.Types.ObjectId,
  date: Date,
  operation: () => Promise<T>,
): Promise<T> {
  const businessObjectId = new mongoose.Types.ObjectId(businessId);
  const day = new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const token = randomUUID();
  let acquired = false;

  // Garante o índice único mesmo em produção com autoIndex desativado.
  uniqueIndexPromise ??= BookingDayLock.collection.createIndex(
    { businessId: 1, date: 1 },
    { unique: true },
  );
  try {
    await uniqueIndexPromise;
  } catch (error) {
    uniqueIndexPromise = undefined;
    throw error;
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const now = new Date();

    try {
      const lock = await BookingDayLock.findOneAndUpdate(
        {
          businessId: businessObjectId,
          date: day,
          lockedUntil: { $lte: now },
        },
        {
          $set: {
            token,
            lockedUntil: new Date(now.getTime() + LOCK_LEASE_MS),
          },
          $setOnInsert: { businessId: businessObjectId, date: day },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();

      acquired = lock?.token === token;
    } catch (error) {
      // Duas primeiras reservas podem tentar criar o mutex ao mesmo tempo.
      // O índice único escolhe uma delas; a outra tenta adquirir novamente.
      if (
        !(typeof error === "object" && error !== null && "code" in error && error.code === 11000)
      ) {
        throw error;
      }
    }

    if (acquired) break;
    await wait(100 + Math.min(attempt * 25, 300));
  }

  if (!acquired) {
    throw new Error("BOOKING_LOCK_BUSY");
  }

  try {
    return await operation();
  } finally {
    await BookingDayLock.updateOne(
      { businessId: businessObjectId, date: day, token },
      { $set: { token: "", lockedUntil: new Date(0) } },
    );
  }
}
