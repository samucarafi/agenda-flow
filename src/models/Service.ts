import mongoose, { Schema, models, type Model } from "mongoose";

export interface IService {
  businessId: mongoose.Types.ObjectId;
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
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
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
      max: 480,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      max: 999999,
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

serviceSchema.index({ businessId: 1, name: 1 }, { unique: true });

const Service =
  (models.Service as Model<IService> | undefined) ??
  mongoose.model<IService>("Service", serviceSchema);

export { Service };
export default Service;
