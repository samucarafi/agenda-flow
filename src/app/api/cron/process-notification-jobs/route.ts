import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import NotificationJob from "@/models/NotificationJob";
import Appointment from "@/models/Appointment";
import { notifyUser } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await connectToDatabase();

  const staleProcessingBefore = new Date(Date.now() - 5 * 60 * 1000);
  await NotificationJob.updateMany(
    { status: "processing", processingAt: { $lt: staleProcessingBefore } },
    { $set: { status: "pending" }, $unset: { processingAt: 1 } },
  );

  const dueJobs = await NotificationJob.find({
    status: "pending",
    scheduledAt: { $lte: new Date() },
    attempts: { $lt: 5 },
  })
    .sort({ scheduledAt: 1 })
    .limit(100)
    .select("_id userId businessId appointmentId title body href")
    .lean();

  let processed = 0;

  for (const job of dueJobs) {
    const claimed = await NotificationJob.findOneAndUpdate(
      { _id: job._id, status: "pending" },
      {
        $set: { status: "processing", processingAt: new Date() },
        $inc: { attempts: 1 },
      },
      { new: true },
    );

    if (!claimed) continue;

    try {
      const appointment = await Appointment.findById(job.appointmentId)
        .select("status")
        .lean();

      if (!appointment || appointment.status === "cancelled") {
        await NotificationJob.updateOne(
          { _id: job._id, status: "processing" },
          { $set: { status: "cancelled" }, $unset: { processingAt: 1 } },
        );
        continue;
      }

      const recorded = await notifyUser({
        userId: job.userId.toString(),
        businessId: job.businessId.toString(),
        type: "appointment_reminder",
        title: job.title,
        body: job.body,
        href: job.href,
      });

      if (!recorded) {
        throw new Error("Não foi possível registrar a notificação.");
      }

      await NotificationJob.updateOne(
        { _id: job._id, status: "processing" },
        { $set: { status: "sent", sentAt: new Date() }, $unset: { processingAt: 1 } },
      );
      processed += 1;
    } catch (error) {
      console.error("process-notification-job:", error);
      await NotificationJob.updateOne(
        { _id: job._id, status: "processing" },
        {
          $set: { status: "pending" },
          $unset: { processingAt: 1 },
        },
      );
    }
  }

  await NotificationJob.updateMany(
    { status: "pending", attempts: { $gte: 5 } },
    { $set: { status: "failed" } },
  );

  return NextResponse.json({ processed, checked: dueJobs.length });
}
