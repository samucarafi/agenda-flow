"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface DateSelectorProps {
  selectedDate: number;
  onSelect: (day: number) => void;
}

const days = [
  { day: 18, label: "SEG" },
  { day: 19, label: "TER" },
  { day: 20, label: "QUA" },
  { day: 21, label: "QUI" },
  { day: 22, label: "SEX" },
  { day: 23, label: "SÁB" },
];

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">Setembro 2026</p>
          <h3 className="mt-1 text-sm font-semibold text-zinc-900">
            Escolha uma data
          </h3>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
          >
            <FiChevronLeft size={15} />
          </button>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
          >
            <FiChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {days.map((item) => {
          const selected = selectedDate === item.day;

          return (
            <button
              key={item.day}
              type="button"
              onClick={() => onSelect(item.day)}
              className={`rounded-xl border py-3 transition-all ${
                selected
                  ? "border-[#635bff] bg-[#635bff] text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span className="block text-[9px] font-medium">{item.label}</span>

              <span className="mt-1 block text-sm font-semibold">
                {item.day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
