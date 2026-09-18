import { FiMoreHorizontal } from "react-icons/fi";

const appointments = [
  {
    time: "09:00",
    name: "João Martins",
    service: "Corte de cabelo",
    professional: "Lucas Almeida",
    status: "Confirmado",
  },
  {
    time: "10:30",
    name: "Mariana Costa",
    service: "Coloração",
    professional: "Bruno Martins",
    status: "Confirmado",
  },
  {
    time: "13:00",
    name: "Pedro Alves",
    service: "Barba",
    professional: "Rafael Costa",
    status: "Aguardando",
  },
  {
    time: "14:30",
    name: "Ana Souza",
    service: "Corte + Barba",
    professional: "Lucas Almeida",
    status: "Confirmado",
  },
  {
    time: "16:00",
    name: "Carlos Lima",
    service: "Corte de cabelo",
    professional: "Rafael Costa",
    status: "Confirmado",
  },
];

export function TodaySchedule() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Agenda de hoje
          </h2>

          <p className="mt-0.5 text-xs text-zinc-400">
            Segunda-feira, 20 de setembro
          </p>
        </div>

        <button
          type="button"
          className="text-xs font-medium text-[#635bff] hover:text-[#5148e8]"
        >
          Ver agenda
        </button>
      </div>

      <div className="divide-y divide-zinc-100">
        {appointments.map((appointment) => (
          <div
            key={`${appointment.time}-${appointment.name}`}
            className="flex items-center gap-3 px-5 py-4"
          >
            <span className="w-10 shrink-0 text-xs font-semibold text-zinc-400">
              {appointment.time}
            </span>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500">
              {appointment.name
                .split(" ")
                .map((name) => name[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800">
                {appointment.name}
              </p>

              <p className="truncate text-xs text-zinc-400">
                {appointment.service} · {appointment.professional}
              </p>
            </div>

            <span
              className={`hidden rounded-full px-2 py-1 text-[10px] font-medium sm:block ${
                appointment.status === "Confirmado"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {appointment.status}
            </span>

            <button type="button" className="text-zinc-300 hover:text-zinc-600">
              <FiMoreHorizontal size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
