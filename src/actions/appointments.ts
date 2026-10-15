"use server";

import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

import { Appointment } from "@/models/Appointment";
import { Client } from "@/models/Client";
import { Service } from "@/models/Service";

const appointmentSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  date: z.string().min(1, "Selecione uma data."),
  startTime: z.string().min(1, "Informe o horário."),
  notes: z
    .string()
    .trim()
    .max(500, "As observações são muito longas.")
    .optional()
    .or(z.literal("")),
});

export type AppointmentActionState = {
  success: boolean;
  error?: string;
  appointment?: {
    _id: string;
    clientId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    notes: string;
  };
};

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);

  const totalMinutes = hours * 60 + mins + minutes;

  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0",
  )}`;
}

export async function createAppointment(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "Sua sessão expirou. Entre novamente.",
    };
  }

  const parsed = appointmentSchema.safeParse({
    clientId: formData.get("clientId"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    await connectToDatabase();

    const [client, service] = await Promise.all([
      Client.findOne({
        _id: parsed.data.clientId,
        userId: user.id,
        active: true,
      }),

      Service.findOne({
        _id: parsed.data.serviceId,
        userId: user.id,
        active: true,
      }),
    ]);

    if (!client) {
      return {
        success: false,
        error: "Cliente não encontrado.",
      };
    }

    if (!service) {
      return {
        success: false,
        error: "Serviço não encontrado.",
      };
    }

    const endTime = addMinutes(parsed.data.startTime, service.duration);

    const conflictingAppointment = await Appointment.findOne({
      userId: user.id,
      date: new Date(`${parsed.data.date}T00:00:00`),
      status: {
        $ne: "cancelled",
      },
      startTime: {
        $lt: endTime,
      },
      endTime: {
        $gt: parsed.data.startTime,
      },
    });

    if (conflictingAppointment) {
      return {
        success: false,
        error: "Já existe um agendamento nesse horário.",
      };
    }

    const appointment = await Appointment.create({
      userId: user.id,
      clientId: client._id,
      serviceId: service._id,
      date: new Date(`${parsed.data.date}T00:00:00`),
      startTime: parsed.data.startTime,
      endTime,
      status: "scheduled",
      notes: parsed.data.notes ?? "",
    });

    return {
      success: true,
      appointment: {
        _id: appointment._id.toString(),
        clientId: appointment.clientId.toString(),
        serviceId: appointment.serviceId.toString(),
        date: appointment.date.toISOString(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes ?? "",
      },
    };
  } catch (error) {
    console.error("createAppointment:", error);

    return {
      success: false,
      error: "Não foi possível criar o agendamento.",
    };
  }
}

export async function getAppointments(date: string) {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  await connectToDatabase();

  const appointments = await Appointment.find({
    userId: user.id,
    date: new Date(`${date}T00:00:00`),
  })
    .populate("clientId", "name email phone")
    .populate("serviceId", "name duration price")
    .sort({ startTime: 1 })
    .lean();

  return appointments.map((appointment) => ({
    _id: appointment._id.toString(),

    client: {
      _id: appointment.clientId._id.toString(),
      name: appointment.clientId.name,
      email: appointment.clientId.email,
      phone: appointment.clientId.phone,
    },

    service: {
      _id: appointment.serviceId._id.toString(),
      name: appointment.serviceId.name,
      duration: appointment.serviceId.duration,
      price: appointment.serviceId.price,
    },

    date: appointment.date.toISOString(),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    notes: appointment.notes ?? "",
  }));
}
