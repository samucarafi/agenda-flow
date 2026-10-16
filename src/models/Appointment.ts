import mongoose, { Schema, models, type Model } from "mongoose";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface IAppointment {
  businessId: mongoose.Types.ObjectId;

  // Conta do cliente que fez a reserva online.
  // Pode estar ausente em agendamentos administrativos antigos.
  userId?: mongoose.Types.ObjectId;

  clientId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;

  date: Date;
  startTime: string;
  endTime: string;

  status: AppointmentStatus;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },

    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Consultas da agenda por negócio e data.
appointmentSchema.index({
  businessId: 1,
  date: 1,
  startTime: 1,
});

// Consultas de reservas de uma conta de cliente.
appointmentSchema.index({
  userId: 1,
  date: -1,
});

// Ajuda a consultar reservas ativas de um negócio.
appointmentSchema.index({
  businessId: 1,
  date: 1,
  status: 1,
});

const Appointment =
  (models.Appointment as Model<IAppointment> | undefined) ??
  mongoose.model<IAppointment>("Appointment", appointmentSchema);

export { Appointment };
export default Appointment;
