"use client";

import { FiMail, FiPhone, FiUser } from "react-icons/fi";

interface CustomerFormProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function CustomerForm({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: CustomerFormProps) {
  return (
    <div>
      <div>
        <p className="text-xs font-medium text-[#635bff]">Seus dados</p>

        <h2 className="mt-1 text-lg font-semibold text-zinc-900">
          Como podemos confirmar seu horário?
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Preencha seus dados para finalizar o agendamento.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-600">
            Nome
          </span>

          <div className="relative">
            <FiUser
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="text"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Seu nome"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/10"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-600">
            E-mail
          </span>

          <div className="relative">
            <FiMail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="voce@email.com"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/10"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-600">
            Telefone
          </span>

          <div className="relative">
            <FiPhone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="tel"
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder="(21) 99999-9999"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/10"
            />
          </div>
        </label>
      </div>
    </div>
  );
}
