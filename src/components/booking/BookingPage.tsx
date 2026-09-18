"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

import { availableTimes, professionals, services } from "@/data/booking";

import { ServiceSelector } from "./ServiceSelector";
import { ProfessionalSelector } from "./ProfessionalSelector";
import { DateSelector } from "./DateSelector";
import { TimeSelector } from "./TimeSelector";
import { BookingSummary } from "./BookingSummary";
import { BookingSuccess } from "./BookingSuccess";
import { CustomerForm } from "./CustomerForm";

export function BookingPage() {
  const [step, setStep] = useState(1);

  const [selectedService, setSelectedService] = useState("corte");

  const [selectedProfessional, setSelectedProfessional] = useState("lucas");

  const [selectedDate, setSelectedDate] = useState(20);

  const [selectedTime, setSelectedTime] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const service = useMemo(
    () => services.find((item) => item.id === selectedService),
    [selectedService],
  );

  const professional = useMemo(
    () => professionals.find((item) => item.id === selectedProfessional),
    [selectedProfessional],
  );

  const isCustomerFormValid =
    name.trim().length >= 3 &&
    email.includes("@") &&
    phone.replace(/\D/g, "").length >= 10;

  const canContinue =
    (step === 1 && Boolean(selectedService)) ||
    (step === 2 && Boolean(selectedProfessional)) ||
    (step === 3 && Boolean(selectedDate && selectedTime)) ||
    (step === 4 && isCustomerFormValid);

  if (step === 5) {
    return (
      <BookingSuccess
        serviceName={service?.name || ""}
        professionalName={professional?.name || ""}
        date={selectedDate}
        time={selectedTime}
      />
    );
  }

  const nextStep = () => {
    if (!canContinue) return;

    setStep((current) => current + 1);
  };

  const previousStep = () => {
    if (step > 1) {
      setStep((current) => current - 1);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-zinc-900"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635bff] text-xs text-white">
              A
            </span>
            AgendaFlow
          </Link>

          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-900">
            Cancelar
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-700"
          >
            <FiArrowLeft size={13} />
            Voltar
          </Link>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Agende seu horário
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Escolha as opções abaixo e reserve seu atendimento.
          </p>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`h-1.5 flex-1 rounded-full ${
                item <= step ? "bg-[#635bff]" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
            {step === 1 && (
              <>
                <div>
                  <p className="text-xs font-medium text-[#635bff]">
                    Etapa 1 de 4
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                    Escolha um serviço
                  </h2>
                </div>

                <div className="mt-6">
                  <ServiceSelector
                    services={services}
                    selectedService={selectedService}
                    onSelect={setSelectedService}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="text-xs font-medium text-[#635bff]">
                    Etapa 2 de 4
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                    Escolha o profissional
                  </h2>
                </div>

                <div className="mt-6">
                  <ProfessionalSelector
                    professionals={professionals}
                    selectedProfessional={selectedProfessional}
                    onSelect={setSelectedProfessional}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <p className="text-xs font-medium text-[#635bff]">
                    Etapa 3 de 4
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                    Escolha data e horário
                  </h2>
                </div>

                <div className="mt-6 space-y-7">
                  <DateSelector
                    selectedDate={selectedDate}
                    onSelect={setSelectedDate}
                  />

                  <TimeSelector
                    times={availableTimes}
                    selectedTime={selectedTime}
                    onSelect={setSelectedTime}
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <CustomerForm
                name={name}
                email={email}
                phone={phone}
                onNameChange={setName}
                onEmailChange={setEmail}
                onPhoneChange={setPhone}
              />
            )}

            <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-5">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 1}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#635bff] px-5 text-sm font-semibold text-white transition-all hover:bg-[#5148e8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === 4 ? "Confirmar agendamento" : "Continuar"}

                <FiArrowRight size={15} />
              </button>
            </div>
          </div>

          <BookingSummary
            service={service}
            professional={professional}
            time={selectedTime}
          />
        </div>
      </div>
    </main>
  );
}
