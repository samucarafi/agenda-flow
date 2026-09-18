const upcoming = [
  {
    name: "Fernanda Oliveira",
    service: "Corte + Barba",
    date: "Amanhã · 09:30",
  },
  {
    name: "Lucas Ribeiro",
    service: "Corte de cabelo",
    date: "Amanhã · 11:00",
  },
  {
    name: "Beatriz Santos",
    service: "Sobrancelha",
    date: "22 Set · 14:00",
  },
  {
    name: "Gabriel Souza",
    service: "Barba",
    date: "22 Set · 16:30",
  },
];

export function UpcomingAppointments() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          Próximos clientes
        </h2>

        <p className="mt-0.5 text-xs text-zinc-400">
          Seus próximos atendimentos
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        {upcoming.map((appointment) => (
          <div
            key={`${appointment.name}-${appointment.date}`}
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-[10px] font-semibold text-[#635bff]">
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
                {appointment.service}
              </p>
            </div>

            <p className="shrink-0 text-[10px] font-medium text-zinc-400">
              {appointment.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
