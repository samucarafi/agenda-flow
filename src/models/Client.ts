import mongoose, { Schema, models, type Model } from "mongoose";

export interface IClient {
  businessId: mongoose.Types.ObjectId;
  accountUserId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },

    accountUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
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

clientSchema.index({ businessId: 1, email: 1 }, { unique: true });

const Client =
  (models.Client as Model<IClient> | undefined) ??
  mongoose.model<IClient>("Client", clientSchema);

export { Client };
export default Client;
