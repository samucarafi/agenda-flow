"use client";

import { FiCheck, FiClock } from "react-icons/fi";
import type { Service } from "@/data/booking";

interface ServiceSelectorProps {
  services: Service[];
  selectedService: string;
  onSelect: (id: string) => void;
}

export function ServiceSelector({
  services,
  selectedService,
  onSelect,
}: ServiceSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((service) => {
        const selected = selectedService === service.id;

        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected
                ? "border-[#635bff] bg-[#635bff]/5 shadow-sm"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {service.name}
                </h3>

                <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                  <FiClock size={13} />
                  {service.duration} min
                </div>
              </div>

              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                  selected
                    ? "border-[#635bff] bg-[#635bff] text-white"
                    : "border-zinc-200 text-transparent"
                }`}
              >
                <FiCheck size={13} />
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold text-zinc-900">
              R$ {service.price.toFixed(2).replace(".", ",")}
            </p>
          </button>
        );
      })}
    </div>
  );
}
