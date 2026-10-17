import mongoose, { Schema, models, type Model } from "mongoose";

export const RESTAURANT_TABLE_STATUSES = [
  "available",
  "occupied",
  "cleaning",
  "blocked",
] as const;
export type RestaurantTableStatus = (typeof RESTAURANT_TABLE_STATUSES)[number];

export interface IRestaurantTable {
  businessId: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  status: RestaurantTableStatus;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantTableSchema = new Schema<IRestaurantTable>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
    capacity: { type: Number, required: true, min: 1, max: 40, validate: Number.isInteger },
    status: { type: String, enum: RESTAURANT_TABLE_STATUSES, default: "available", required: true },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { timestamps: true },
);

restaurantTableSchema.index({ businessId: 1, name: 1 }, { unique: true });
restaurantTableSchema.index({ businessId: 1, active: 1, status: 1 });

const RestaurantTable =
  (models.RestaurantTable as Model<IRestaurantTable> | undefined) ??
  mongoose.model<IRestaurantTable>("RestaurantTable", restaurantTableSchema);

export default RestaurantTable;
