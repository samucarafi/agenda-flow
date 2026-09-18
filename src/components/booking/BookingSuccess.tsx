import Link from "next/link";
import { FiArrowLeft, FiCheck, FiCalendar } from "react-icons/fi";

interface BookingSuccessProps {
  serviceName: string;
  professionalName: string;
  date: number;
  time: string;
}

export function BookingSuccess({
  serviceName,
  professionalName,
  date,
  time,
}: BookingSuccessProps) {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center sm:py-28">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
        <FiCheck size={28} />
      </div>

      <p className="mt-6 text-sm font-semibold text-emerald-600">
        Agendamento confirmado
      </p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
        Tudo certo!
      </h1>

      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500">
        Seu horário foi reservado. Confira os detalhes do seu atendimento
        abaixo.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
            <FiCalendar size={18} />
          </div>

          <div>
            <p className="text-xs text-zinc-400">Agendamento</p>

            <p className="text-sm font-semibold text-zinc-900">{serviceName}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-400">Data</p>
            <p className="mt-1 text-sm font-medium text-zinc-800">
              {date} de setembro de 2026
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Horário</p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{time}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Profissional</p>
            <p className="mt-1 text-sm font-medium text-zinc-800">
              {professionalName}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Status</p>
            <p className="mt-1 text-sm font-medium text-emerald-600">
              Confirmado
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <FiArrowLeft size={15} />
        Voltar para o início
      </Link>
    </div>
  );
}
