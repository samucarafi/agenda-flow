"use client";

import { FiCheck } from "react-icons/fi";
import type { Professional } from "@/data/booking";

interface ProfessionalSelectorProps {
  professionals: Professional[];
  selectedProfessional: string;
  onSelect: (id: string) => void;
}

export function ProfessionalSelector({
  professionals,
  selectedProfessional,
  onSelect,
}: ProfessionalSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {professionals.map((professional) => {
        const selected = selectedProfessional === professional.id;

        return (
          <button
            key={professional.id}
            type="button"
            onClick={() => onSelect(professional.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected
                ? "border-[#635bff] bg-[#635bff]/5"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                {professional.initials}
              </div>

              {selected && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#635bff] text-white">
                  <FiCheck size={13} />
                </span>
              )}
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              {professional.name}
            </h3>

            <p className="mt-1 text-xs text-zinc-400">{professional.role}</p>
          </button>
        );
      })}
    </div>
  );
}
