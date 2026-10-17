"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import Client from "@/models/Client";
import Appointment from "@/models/Appointment";

const bookingSchema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i),
  serviceId: z.string().regex(/^[a-f\d]{24}$/i),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  phone: z.string().trim().min(8).max(30),
  notes: z.string().trim().max(500).optional().default(""),
});

type BusinessData = {
  _id: unknown;
  name: string;
  slug: string;
  timezone?: string;
  bookingSettings?: {
    enabled?: boolean;
    confirmationMode?: "automatic" | "manual";
    minAdvanceMinutes?: number;
    maxDaysInAdvance?: number;
  };
  availability?: {
    workingDays?: number[];
    openingTime?: string;
    closingTime?: string;
    slotIntervalMinutes?: number;
  };
};

function dateIsValid(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function getLocalParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function localDateTimeToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;

  for (let i = 0; i < 3; i++) {
    const local = getLocalParts(new Date(candidate), timezone);
    const represented = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
    );
    const difference = target - represented;
    if (difference === 0) break;
    candidate += difference;
  }

  const result = new Date(candidate);
  const local = getLocalParts(result, timezone);

  if (
    local.year !== year ||
    local.month !== month ||
    local.day !== day ||
    local.hour !== hour ||
    local.minute !== minute
  ) {
    return null;
  }

  return result;
}

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function timeString(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

async function calculateAvailableSlots(
  businessId: string,
  serviceId: string,
  date: string,
) {
  if (!dateIsValid(date)) {
    return { ok: false as const, slots: [], error: "Data inválida." };
  }

  await connectToDatabase();

  const business = (await Business.findOne({
    _id: businessId,
    status: "active",
    "bookingSettings.enabled": true,
  })
    .select("name slug timezone bookingSettings availability")
    .lean()) as BusinessData | null;

  if (!business) {
    return {
      ok: false as const,
      slots: [],
      error: "Este negócio não está aceitando agendamentos.",
    };
  }

  const service = await Service.findOne({
    _id: serviceId,
    businessId,
    active: true,
  })
    .select("duration")
    .lean();

  if (!service) {
    return { ok: false as const, slots: [], error: "Serviço indisponível." };
  }

  const timezone = business.timezone || "America/Sao_Paulo";
  const settings = business.bookingSettings || {};
  const availability = business.availability || {};
  const workingDays = availability.workingDays ?? [1, 2, 3, 4, 5, 6];
  const openingTime = availability.openingTime || "09:00";
  const closingTime = availability.closingTime || "18:00";
  const interval = availability.slotIntervalMinutes ?? 30;

  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(openingTime) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(closingTime) ||
    ![15, 30, 60].includes(interval) ||
    !Number.isInteger(service.duration) ||
    service.duration <= 0
  ) {
    return {
      ok: false as const,
      slots: [],
      error: "A configuração de horários deste negócio é inválida.",
    };
  }

  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  if (!workingDays.includes(weekday)) {
    return { ok: true as const, slots: [], error: "" };
  }

  const todayParts = getLocalParts(new Date(), timezone);
  const today = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;

  const dateNumber = Date.parse(`${date}T00:00:00Z`);
  const todayNumber = Date.parse(`${today}T00:00:00Z`);
  const daysAhead = (dateNumber - todayNumber) / 86_400_000;

  if (daysAhead < 0 || daysAhead > (settings.maxDaysInAdvance ?? 60)) {
    return { ok: true as const, slots: [], error: "" };
  }

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const appointments = await Appointment.find({
    businessId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["cancelled"] },
  })
    .select("startTime endTime")
    .lean();

  const now = Date.now();
  const minimumAdvance = settings.minAdvanceMinutes ?? 60;
  const opening = minutes(openingTime);
  const closing = minutes(closingTime);
  const slots: string[] = [];

  if (closing <= opening) {
    return {
      ok: false as const,
      slots: [],
      error: "O horário de fechamento precisa ser posterior à abertura.",
    };
  }

  for (
    let start = opening;
    start + service.duration <= closing;
    start += interval
  ) {
    const end = start + service.duration;
    const startTime = timeString(start);
    const instant = localDateTimeToUtc(date, startTime, timezone);

    if (!instant || instant.getTime() < now + minimumAdvance * 60_000) {
      continue;
    }

    const overlaps = appointments.some(
      (appointment) =>
        minutes(appointment.startTime) < end &&
        minutes(appointment.endTime) > start,
    );

    if (!overlaps) slots.push(startTime);
  }

  return { ok: true as const, slots, error: "" };
}

export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  date: string,
) {
  try {
    return await calculateAvailableSlots(businessId, serviceId, date);
  } catch {
    return {
      ok: false as const,
      slots: [],
      error: "Não foi possível consultar os horários agora.",
    };
  }
}

export async function createPublicAppointment(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false as const, error: "Entre na sua conta para agendar." };
  }

  if (user.role !== "client") {
    return {
      ok: false as const,
      error: "Entre com uma conta de cliente para realizar o agendamento.",
    };
  }

  const parsed = bookingSchema.safeParse({
    businessId: formData.get("businessId"),
    serviceId: formData.get("serviceId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    phone: formData.get("phone"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Confira a data, o horário e o telefone informado.",
    };
  }

  const input = parsed.data;
  const availability = await calculateAvailableSlots(
    input.businessId,
    input.serviceId,
    input.date,
  );

  if (!availability.ok || !availability.slots.includes(input.startTime)) {
    return {
      ok: false as const,
      error: "Este horário não está mais disponível. Escolha outro.",
    };
  }

  await connectToDatabase();

  const business = await Business.findOne({
    _id: input.businessId,
    status: "active",
    "bookingSettings.enabled": true,
  })
    .select("_id bookingSettings")
    .lean();

  const service = await Service.findOne({
    _id: input.serviceId,
    businessId: input.businessId,
    active: true,
  })
    .select("_id duration")
    .lean();

  if (!business || !service) {
    return { ok: false as const, error: "Negócio ou serviço indisponível." };
  }

  let client = await Client.findOne({
    businessId: input.businessId,
    accountUserId: user.id,
    active: true,
  });

  if (!client) {
    const existingProfile = await Client.findOne({
      businessId: input.businessId,
      email: user.email.toLowerCase(),
      active: true,
    }).select("_id accountUserId");

    if (existingProfile) {
      return {
        ok: false as const,
        error:
          "Já existe um cadastro com seu e-mail neste negócio. Peça ao estabelecimento para vincular seu cadastro à sua conta antes de agendar.",
      };
    }

    client = await Client.create({
      businessId: input.businessId,
      accountUserId: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      phone: input.phone,
      active: true,
    });
  } else {
    client.phone = input.phone;
    await client.save();
  }

  const start = minutes(input.startTime);
  const endTime = timeString(start + service.duration);
  const appointmentDate = new Date(`${input.date}T00:00:00.000Z`);

  // Verificação final contra conflitos antes da gravação.
  const conflict = await Appointment.findOne({
    businessId: input.businessId,
    date: appointmentDate,
    status: { $nin: ["cancelled"] },
    startTime: { $lt: endTime },
    endTime: { $gt: input.startTime },
  })
    .select("_id")
    .lean();

  if (conflict) {
    return {
      ok: false as const,
      error: "Alguém acabou de reservar esse horário. Escolha outro.",
    };
  }

  const confirmationMode = business.bookingSettings?.confirmationMode;
  await Appointment.create({
    businessId: input.businessId,
    userId: user.id,
    clientId: client._id,
    serviceId: service._id,
    date: appointmentDate,
    startTime: input.startTime,
    endTime,
    status: confirmationMode === "automatic" ? "confirmed" : "scheduled",
    notes: input.notes,
  });

  return {
    ok: true as const,
    message:
      confirmationMode === "automatic"
        ? "Agendamento confirmado com sucesso!"
        : "Solicitação enviada! Aguarde a confirmação do estabelecimento.",
  };
}
