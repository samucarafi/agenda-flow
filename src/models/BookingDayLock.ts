import mongoose, { Schema, models, type Model } from "mongoose";

export interface IBookingDayLock {
  businessId: mongoose.Types.ObjectId;
  date: Date;
  token: string;
  lockedUntil: Date;
}

const bookingDayLockSchema = new Schema<IBookingDayLock>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    date: { type: Date, required: true },
    token: { type: String, required: true, default: "" },
    lockedUntil: { type: Date, required: true, default: new Date(0) },
  },
  { versionKey: false },
);

bookingDayLockSchema.index({ businessId: 1, date: 1 }, { unique: true });

const BookingDayLock =
  (models.BookingDayLock as Model<IBookingDayLock> | undefined) ??
  mongoose.model<IBookingDayLock>("BookingDayLock", bookingDayLockSchema);

export default BookingDayLock;
