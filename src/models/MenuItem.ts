import mongoose, { Schema, models, type Model } from "mongoose";

export interface IMenuItem {
  businessId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  dietaryTags: string[];
  available: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 600, default: "" },
    price: { type: Number, min: 0, max: 999999, default: undefined },
    imageUrl: { type: String, trim: true, maxlength: 2048, default: "" },
    dietaryTags: { type: [String], default: [], validate: (tags: string[]) => tags.length <= 20 && tags.every((tag) => tag.length <= 40) },
    available: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, min: 0, max: 10000, default: 0 },
  },
  { timestamps: true },
);
menuItemSchema.index({ businessId: 1, categoryId: 1, available: 1, sortOrder: 1 });

const MenuItem =
  (models.MenuItem as Model<IMenuItem> | undefined) ??
  mongoose.model<IMenuItem>("MenuItem", menuItemSchema);

export default MenuItem;
