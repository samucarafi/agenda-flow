import mongoose, { Schema, models } from "mongoose";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface IAppointment {
  userId: mongoose.Types.ObjectId;
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

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      index: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
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

AppointmentSchema.index({
  userId: 1,
  date: 1,
});

export const Appointment =
  models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
