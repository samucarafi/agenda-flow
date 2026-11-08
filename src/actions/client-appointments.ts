"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import { notifyUser } from "@/lib/notifications";
import { cancelAppointmentReminders, scheduleAppointmentReminders } from "@/lib/appointment-reminders";
import { getAvailableSlots } from "@/actions/public-bookings";
import Appointment from "@/models/Appointment";
import Client from "@/models/Client";
import Service from "@/models/Service";
import { withBookingDayLock } from "@/lib/booking-lock";

const appointmentIdSchema = z.string().refine(mongoose.isValidObjectId);
const rescheduleSchema = z.object({
  appointmentId: appointmentIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
});

async function getClientAppointment(appointmentId: string, userId: string) {
  if (!mongoose.isValidObjectId(appointmentId)) return null;

  await connectToDatabase();

  const clientProfiles = await Client.find({
    accountUserId: userId,
    active: true,
  })
    .select("_id")
    .lean();

  const clientIds = clientProfiles.map((client) => client._id);

  return Appointment.findOne({
    _id: appointmentId,
    $or: [{ userId }, { clientId: { $in: clientIds } }],
  });
}

export async function cancelClientAppointment(appointmentId: string) {
  const user = await getCurrentUser();

  if (!user || user.role !== "client") {
    return { success: false, error: "Faça login como cliente." };
  }

  if (!mongoose.isValidObjectId(appointmentId)) {
    return { success: false, error: "Agendamento inválido." };
  }

  try {
    const appointment = await getClientAppointment(appointmentId, user.id);

    if (!appointment) {
      return {
        success: false,
        error: "Agendamento não encontrado ou sem autorização.",
      };
    }

    if (!["scheduled", "confirmed"].includes(appointment.status)) {
      return {
        success: false,
        error: "Este agendamento não pode mais ser cancelado.",
      };
    }

    appointment.status = "cancelled";
    await appointment.save();
    try {
      await cancelAppointmentReminders(appointment._id.toString());

      const business = await Business.findById(appointment.businessId)
        .select("ownerId name")
        .lean();

      if (business) {
        await notifyUser({
          userId: business.ownerId.toString(),
          businessId: appointment.businessId.toString(),
          type: "appointment_cancelled",
          title: "Agendamento cancelado",
          body: "Um cliente cancelou um agendamento.",
          href: "/dashboard",
        });
      }
    } catch (notificationError) {
      console.error("Falha ao processar notificações do cancelamento:", notificationError);
    }

    revalidatePath("/cliente");

    return { success: true };
  } catch (error) {
    console.error("cancelClientAppointment:", error);

    return {
      success: false,
      error: "Não foi possível cancelar o agendamento.",
    };
  }
}

export async function rescheduleClientAppointment(input: {
  appointmentId: string;
  date: string;
  startTime: string;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "client") {
    return { success: false, error: "Faça login como cliente." };
  }

  const parsed = rescheduleSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Data ou horário inválido." };
  }

  try {
    const appointment = await getClientAppointment(
      parsed.data.appointmentId,
      user.id,
    );

    if (!appointment) {
      return {
        success: false,
        error: "Agendamento não encontrado ou sem autorização.",
      };
    }

    if (!["scheduled", "confirmed"].includes(appointment.status)) {
      return {
        success: false,
        error: "Este agendamento não pode ser reagendado.",
      };
    }

    const date = new Date(`${parsed.data.date}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== parsed.data.date
    ) {
      return { success: false, error: "Informe uma data válida." };
    }

    const businessId = appointment.businessId.toString();
    const serviceId = appointment.serviceId.toString();

    const availability = await getAvailableSlots(
      businessId,
      serviceId,
      parsed.data.date,
    );

    if (
      !availability.ok ||
      !availability.slots.includes(parsed.data.startTime)
    ) {
      return {
        success: false,
        error: "Esse horário não está disponível. Escolha outro.",
      };
    }

    await connectToDatabase();

    const service = await Service.findOne({
      _id: appointment.serviceId,
      businessId: appointment.businessId,
      active: true,
    })
      .select("duration")
      .lean();

    if (
      !service ||
      !Number.isInteger(service.duration) ||
      service.duration <= 0
    ) {
      return { success: false, error: "O serviço não está disponível." };
    }

    const [hours, minutes] = parsed.data.startTime.split(":").map(Number);
    const endMinutes = hours * 60 + minutes + service.duration;

    if (endMinutes > 23 * 60 + 59) {
      return {
        success: false,
        error: "O horário de término ultrapassa o limite do dia.",
      };
    }

    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

    const saved = await withBookingDayLock(appointment.businessId, date, async () => {
      // Exclui o próprio agendamento e serializa a atualização com novas reservas.
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        businessId: appointment.businessId,
        date,
        status: { $ne: "cancelled" },
        startTime: { $lt: endTime },
        endTime: { $gt: parsed.data.startTime },
      }).select("_id").lean();

      if (conflict) return false;

      appointment.date = date;
      appointment.startTime = parsed.data.startTime;
      appointment.endTime = endTime;
      await appointment.save();
      return true;
    });

    if (!saved) {
      return { success: false, error: "Esse horário acabou de ser ocupado. Escolha outro." };
    }

    try {
      const business = await Business.findById(appointment.businessId)
        .select("ownerId name timezone")
        .lean();

      await cancelAppointmentReminders(appointment._id.toString());

      if (business) {
        await Promise.allSettled([
          scheduleAppointmentReminders({
            userId: user.id,
            businessId: appointment.businessId.toString(),
            appointmentId: appointment._id.toString(),
            date: parsed.data.date,
            startTime: parsed.data.startTime,
            timezone: business.timezone,
            businessName: business.name,
          }),
          notifyUser({
            userId: business.ownerId.toString(),
            businessId: appointment.businessId.toString(),
            type: "appointment_confirmed",
            title: "Agendamento reagendado",
            body: "Um cliente alterou o horário de um agendamento.",
            href: "/dashboard",
          }),
        ]);
      }
    } catch (notificationError) {
      console.error("Falha ao atualizar notificações do reagendamento:", notificationError);
    }

    revalidatePath("/cliente");

    return { success: true };
  } catch (error) {
    console.error("rescheduleClientAppointment:", error);

    return {
      success: false,
      error: "Não foi possível reagendar. Tente novamente.",
    };
  }
}
