"use client";

import { FiClock } from "react-icons/fi";

interface TimeSelectorProps {
  times: string[];
  selectedTime: string;
  onSelect: (time: string) => void;
}

const unavailableTimes = ["10:30", "13:30", "16:00"];

export function TimeSelector({
  times,
  selectedTime,
  onSelect,
}: TimeSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Escolha um horário
          </h3>

          <p className="mt-1 text-xs text-zinc-400">
            Horários disponíveis para o atendimento
          </p>
        </div>

        <FiClock size={16} className="text-zinc-300" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {times.map((time) => {
          const unavailable = unavailableTimes.includes(time);

          const selected = selectedTime === time;

          return (
            <button
              key={time}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(time)}
              className={`rounded-xl border py-2.5 text-xs font-medium transition-all ${
                unavailable
                  ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300 line-through"
                  : selected
                    ? "border-[#635bff] bg-[#635bff] text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-[#635bff]/30 hover:text-[#635bff]"
              }`}
            >
              {time}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#635bff]" />
          Selecionado
        </span>

        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-zinc-200" />
          Indisponível
        </span>
      </div>
    </div>
  );
}
