import mongoose, { Schema, models } from "mongoose";

export interface IService {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  duration: number;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    duration: {
      type: Number,
      required: true,
      min: 5,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

serviceSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Service =
  models.Service || mongoose.model<IService>("Service", serviceSchema);
