import mongoose from "mongoose";

import NotificationJob from "@/models/NotificationJob";

function zonedLocalDateTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desiredUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const representedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    const difference = desiredUtc - representedUtc;

    if (difference === 0) break;
    guess += difference;
  }

  const result = new Date(guess);
  return Number.isNaN(result.getTime()) ? null : result;
}

export async function cancelAppointmentReminders(appointmentId: string) {
  if (!mongoose.isValidObjectId(appointmentId)) return;

  await NotificationJob.updateMany(
    {
      appointmentId,
      status: { $in: ["pending", "processing"] },
    },
    { $set: { status: "cancelled" } },
  );
}

export async function scheduleAppointmentReminders(input: {
  userId?: string | null;
  businessId: string;
  appointmentId: string;
  date: string;
  startTime: string;
  timezone?: string;
  businessName: string;
}) {
  const userId = input.userId;

  if (
    !userId ||
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(input.businessId) ||
    !mongoose.isValidObjectId(input.appointmentId)
  ) {
    return;
  }

  const appointmentStart = zonedLocalDateTimeToUtc(
    input.date,
    input.startTime,
    input.timezone || "America/Sao_Paulo",
  );

  if (!appointmentStart) return;

  const now = Date.now();
  const reminders = [
    { reminderKey: "24h" as const, offset: 24 * 60 * 60 * 1000, label: "amanhã" },
    { reminderKey: "1h" as const, offset: 60 * 60 * 1000, label: "em aproximadamente 1 hora" },
  ]
    .map((reminder) => ({
      ...reminder,
      scheduledAt: new Date(appointmentStart.getTime() - reminder.offset),
    }))
    .filter((reminder) => reminder.scheduledAt.getTime() > now);

  await cancelAppointmentReminders(input.appointmentId);

  if (!reminders.length) return;

  await NotificationJob.bulkWrite(
    reminders.map((reminder) => ({
      updateOne: {
        filter: {
          appointmentId: new mongoose.Types.ObjectId(input.appointmentId),
          userId: new mongoose.Types.ObjectId(userId),
          reminderKey: reminder.reminderKey,
          scheduledAt: reminder.scheduledAt,
        },
        update: {
          $set: {
            businessId: new mongoose.Types.ObjectId(input.businessId),
            title: "Lembrete de agendamento",
            body: `Seu atendimento em ${input.businessName} começa ${reminder.label}.`,
            href: "/cliente",
            status: "pending",
            attempts: 0,
            sentAt: null,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}
