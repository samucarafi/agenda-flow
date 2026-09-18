import { FiCalendar, FiClock, FiDollarSign, FiUsers } from "react-icons/fi";

const stats = [
  {
    label: "Agendamentos hoje",
    value: "24",
    change: "+12%",
    icon: FiCalendar,
  },
  {
    label: "Clientes atendidos",
    value: "18",
    change: "+8%",
    icon: FiUsers,
  },
  {
    label: "Horários disponíveis",
    value: "12",
    change: "Hoje",
    icon: FiClock,
  },
  {
    label: "Faturamento",
    value: "R$ 1.840",
    change: "+18%",
    icon: FiDollarSign,
  },
];

export function Stats() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                <Icon size={17} />
              </div>

              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-600">
                {stat.change}
              </span>
            </div>

            <p className="mt-5 text-xs text-zinc-400">{stat.label}</p>

            <p className="mt-1 text-xl font-bold tracking-tight text-zinc-900">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
