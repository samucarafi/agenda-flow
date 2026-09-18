import mongoose, { Schema, models } from "mongoose";

const AppointmentSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    professional: {
      type: Schema.Types.ObjectId,
      ref: "Professional",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

AppointmentSchema.index({
  professional: 1,
  date: 1,
});

AppointmentSchema.index({
  client: 1,
  date: -1,
});

export const Appointment =
  models.Appointment || mongoose.model("Appointment", AppointmentSchema);
