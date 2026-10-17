import mongoose, { Schema, models, type Model } from "mongoose";

export interface IMenuCategory {
  businessId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    sortOrder: { type: Number, min: 0, max: 10000, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
menuCategorySchema.index({ businessId: 1, name: 1 }, { unique: true });

const MenuCategory =
  (models.MenuCategory as Model<IMenuCategory> | undefined) ??
  mongoose.model<IMenuCategory>("MenuCategory", menuCategorySchema);

export default MenuCategory;
