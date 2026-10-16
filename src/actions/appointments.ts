"use server";

import mongoose from "mongoose";
import { z } from "zod";

import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import { Appointment } from "@/models/Appointment";
import { Client } from "@/models/Client";
import { Service } from "@/models/Service";

const appointmentSchema = z.object({
  businessId: z.string().min(1, "Negócio inválido."),
  clientId: z.string().min(1, "Selecione um cliente."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  startTime: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Horário inválido."),
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

function parseDateOnly(value: string): Date | null {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function addMinutes(time: string, minutes: number): string | null {
  const [hours, mins] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + mins + minutes;

  // Por enquanto, não permitimos agendamentos
  // que terminem no dia seguinte.
  if (
    !Number.isInteger(minutes) ||
    minutes <= 0 ||
    totalMinutes > 23 * 60 + 59
  ) {
    return null;
  }

  const endHours = Math.floor(totalMinutes / 60);
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
  const parsed = appointmentSchema.safeParse({
    businessId: formData.get("businessId"),
    clientId: formData.get("clientId"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Verifique os dados do agendamento.",
    };
  }

  const {
    businessId,
    clientId,
    serviceId,
    date: dateValue,
    startTime,
    notes,
  } = parsed.data;

  if (
    !mongoose.isValidObjectId(businessId) ||
    !mongoose.isValidObjectId(clientId) ||
    !mongoose.isValidObjectId(serviceId)
  ) {
    return {
      success: false,
      error: "Os dados do agendamento são inválidos.",
    };
  }

  const date = parseDateOnly(dateValue);

  if (!date) {
    return {
      success: false,
      error: "Informe uma data válida.",
    };
  }

  try {
    // Valida a sessão, o papel do usuário e a propriedade
    // do negócio no servidor.
    const ownedBusiness = await getOwnedBusiness(businessId);

    if (!ownedBusiness) {
      return {
        success: false,
        error: "Negócio não encontrado ou acesso não autorizado.",
      };
    }

    await connectToDatabase();

    // Cliente e serviço precisam pertencer ao mesmo negócio.
    const [client, service] = await Promise.all([
      Client.findOne({
        _id: clientId,
        businessId,
        active: true,
      }).lean(),

      Service.findOne({
        _id: serviceId,
        businessId,
        active: true,
      }).lean(),
    ]);

    if (!client) {
      return {
        success: false,
        error: "Cliente não encontrado neste negócio.",
      };
    }

    if (!service) {
      return {
        success: false,
        error: "Serviço não encontrado neste negócio.",
      };
    }

    const endTime = addMinutes(startTime, Number(service.duration));

    if (!endTime) {
      return {
        success: false,
        error:
          "O horário de término ultrapassa o limite do dia. Escolha outro horário.",
      };
    }

    // Verifica conflitos somente dentro deste negócio e dia.
    const conflictingAppointment = await Appointment.findOne({
      businessId,
      date,
      status: { $ne: "cancelled" },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    })
      .select("_id")
      .lean();

    if (conflictingAppointment) {
      return {
        success: false,
        error: "Já existe um agendamento nesse horário.",
      };
    }

    const appointment = await Appointment.create({
      businessId,
      clientId: client._id,
      serviceId: service._id,
      date,
      startTime,
      endTime,
      status: "scheduled",
      notes: notes ?? "",
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

export async function getAppointments(businessId: string, dateValue: string) {
  if (
    !mongoose.isValidObjectId(businessId) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    return [];
  }

  const date = parseDateOnly(dateValue);

  if (!date) {
    return [];
  }

  try {
    // Impede que um usuário consulte a agenda de outra empresa.
    const ownedBusiness = await getOwnedBusiness(businessId);

    if (!ownedBusiness) {
      return [];
    }

    await connectToDatabase();

    const appointments = await Appointment.find({
      businessId,
      date,
    })
      .populate("clientId", "name email phone")
      .populate("serviceId", "name duration price")
      .sort({ startTime: 1 })
      .lean();

    return appointments.map((appointment) => {
      const client = appointment.clientId as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        email?: string;
        phone?: string;
      } | null;

      const service = appointment.serviceId as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        duration: number;
        price: number;
      } | null;

      return {
        _id: appointment._id.toString(),
        businessId: appointment.businessId.toString(),
        clientId: client
          ? {
              _id: client._id.toString(),
              name: client.name,
              email: client.email ?? "",
              phone: client.phone ?? "",
            }
          : null,
        serviceId: service
          ? {
              _id: service._id.toString(),
              name: service.name,
              duration: service.duration,
              price: service.price,
            }
          : null,
        date: appointment.date.toISOString(),
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes ?? "",
      };
    });
  } catch (error) {
    console.error("getAppointments:", error);
    return [];
  }
}
