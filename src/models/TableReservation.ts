import mongoose, { Schema, models, type Model } from "mongoose";

export const TABLE_RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "seated",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type TableReservationStatus = (typeof TABLE_RESERVATION_STATUSES)[number];

export interface ITableReservation {
  businessId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  customerName: string;
  phone?: string;
  partySize: number;
  startAt: Date;
  endAt: Date;
  status: TableReservationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tableReservationSchema = new Schema<ITableReservation>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    tableId: { type: Schema.Types.ObjectId, ref: "RestaurantTable", required: true, index: true },
    customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    partySize: { type: Number, required: true, min: 1, max: 40, validate: Number.isInteger },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: TABLE_RESERVATION_STATUSES, default: "pending", required: true, index: true },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

tableReservationSchema.index({ businessId: 1, tableId: 1, startAt: 1, endAt: 1, status: 1 });

tableReservationSchema.pre("validate", function validateReservationWindow() {
  if (this.endAt <= this.startAt) {
    this.invalidate("endAt", "O término deve ser posterior ao início.");
  }
});

const TableReservation =
  (models.TableReservation as Model<ITableReservation> | undefined) ??
  mongoose.model<ITableReservation>("TableReservation", tableReservationSchema);

export default TableReservation;
