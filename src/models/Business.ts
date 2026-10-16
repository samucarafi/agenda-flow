import mongoose, { Schema, models, type Model } from "mongoose";

export const BUSINESS_CATEGORIES = [
  "barbershop",
  "beauty_salon",
  "restaurant",
  "other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export type BusinessStatus = "draft" | "active" | "suspended";

export interface IBusiness {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: BusinessCategory;
  description: string;
  status: BusinessStatus;
  timezone: string;

  theme: {
    template: string;
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
  };

  bookingSettings: {
    enabled: boolean;
    confirmationMode: "automatic" | "manual";
    minAdvanceMinutes: number;
    maxDaysInAdvance: number;
  };

  availability: {
    workingDays: number[];
    openingTime: string;
    closingTime: string;
    slotIntervalMinutes: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },

    category: {
      type: String,
      enum: BUSINESS_CATEGORIES,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "active", "suspended"],
      default: "draft",
      index: true,
    },

    timezone: {
      type: String,
      required: true,
      default: "America/Sao_Paulo",
    },

    theme: {
      template: {
        type: String,
        default: "default",
      },
      primaryColor: {
        type: String,
        default: "#0F172A",
      },
      accentColor: {
        type: String,
        default: "#06B6D4",
      },
      logoUrl: {
        type: String,
        default: "",
      },
    },

    bookingSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      confirmationMode: {
        type: String,
        enum: ["automatic", "manual"],
        default: "manual",
      },
      minAdvanceMinutes: {
        type: Number,
        min: 0,
        default: 60,
      },
      maxDaysInAdvance: {
        type: Number,
        min: 1,
        max: 365,
        default: 60,
      },
    },

    availability: {
      workingDays: {
        type: [Number],
        default: [1, 2, 3, 4, 5, 6],
        validate: {
          validator: (days: number[]) =>
            days.every(
              (day) => Number.isInteger(day) && day >= 0 && day <= 6,
            ) && new Set(days).size === days.length,
          message: "Os dias de funcionamento são inválidos.",
        },
      },
      openingTime: {
        type: String,
        default: "09:00",
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
      },
      closingTime: {
        type: String,
        default: "18:00",
        match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
      },
      slotIntervalMinutes: {
        type: Number,
        enum: [15, 30, 60],
        default: 30,
      },
    },
  },

  {
    timestamps: true,
  },
);

businessSchema.index({ ownerId: 1, createdAt: -1 });

const Business =
  (models.Business as Model<IBusiness> | undefined) ??
  mongoose.model<IBusiness>("Business", businessSchema);

export default Business;
