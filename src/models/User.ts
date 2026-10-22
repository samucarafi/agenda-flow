import mongoose, { Schema, type Document, type Model } from "mongoose";

export type UserRole = "owner" | "client";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "client"],
      default: "client",
      required: true,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const User =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", userSchema);

export default User;
