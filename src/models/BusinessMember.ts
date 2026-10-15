import mongoose, { Schema, models, type Model } from "mongoose";

export type BusinessMemberRole = "owner" | "admin" | "staff";

export interface IBusinessMember {
  businessId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: BusinessMemberRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessMemberSchema = new Schema<IBusinessMember>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "staff"],
      required: true,
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

businessMemberSchema.index({ businessId: 1, userId: 1 }, { unique: true });

businessMemberSchema.index({ userId: 1, active: 1 });

const BusinessMember =
  (models.BusinessMember as Model<IBusinessMember> | undefined) ??
  mongoose.model<IBusinessMember>("BusinessMember", businessMemberSchema);

export default BusinessMember;
