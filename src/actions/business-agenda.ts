"use server";

import mongoose from "mongoose";
import { getOwnedBusiness } from "@/lib/business";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";

export type AgendaAppointment = {
  _id: string;
  client: { _id: string; name: string };
  service: {
    _id: string;
    name: string;
    duration: number;
    price: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
};

export async function getBusinessAppointments(
  businessId: string,
  date: string,
): Promise<{ ok: boolean; appointments: AgendaAppointment[]; error?: string }> {
  try {
    if (
      !mongoose.isValidObjectId(businessId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
    ) {
      return { ok: false, appointments: [], error: "Data inválida." };
    }

    const access = await getOwnedBusiness(businessId);

    if (!access) {
      return {
        ok: false,
        appointments: [],
        error: "Você não tem acesso a esta agenda.",
      };
    }

    await connectToDatabase();

    // Os agendamentos públicos são salvos com a data em UTC à meia-noite.
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const results = await Appointment.find({
      businessId: new mongoose.Types.ObjectId(businessId),
      date: { $gte: start, $lte: end },
    })
      .populate({
        path: "clientId",
        select: "_id name",
        match: { businessId: new mongoose.Types.ObjectId(businessId) },
      })
      .populate({
        path: "serviceId",
        select: "_id name duration price",
        match: { businessId: new mongoose.Types.ObjectId(businessId) },
      })
      .sort({ startTime: 1 })
      .lean();

    type PopulatedAppointment = {
      _id: mongoose.Types.ObjectId;
      clientId: {
        _id: mongoose.Types.ObjectId;
        name: string;
      } | null;
      serviceId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        duration: number;
        price: number;
      } | null;
      date: Date;
      startTime: string;
      endTime: string;
      status: string;
      notes?: string;
    };

    const populated = results as unknown as PopulatedAppointment[];

    const appointments = populated
      .filter((item) => item.clientId && item.serviceId)
      .map((item) => ({
        _id: item._id.toString(),
        client: {
          _id: item.clientId!._id.toString(),
          name: item.clientId!.name,
        },
        service: {
          _id: item.serviceId!._id.toString(),
          name: item.serviceId!.name,
          duration: item.serviceId!.duration,
          price: item.serviceId!.price,
        },
        date: item.date.toISOString().slice(0, 10),
        startTime: item.startTime,
        endTime: item.endTime,
        status: item.status,
        notes: item.notes ?? "",
      }));

    return { ok: true, appointments };
  } catch (error) {
    console.error("getBusinessAppointments:", error);
    return {
      ok: false,
      appointments: [],
      error: "Não foi possível carregar os agendamentos.",
    };
  }
}
