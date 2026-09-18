"use client";

import { useMemo, useState } from "react";
import { FiClock, FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { DashboardLayout } from "./DashboardLayout";
import { deleteService } from "@/actions/services";
import { ServiceModal } from "./ServiceModal";

type ServiceData = {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
  createdAt: string;
};

interface ServicesPageProps {
  services: ServiceData[];
}

export function ServicesPage({ services: initialServices }: ServicesPageProps) {
  const [services, setServices] = useState<ServiceData[]>(initialServices);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  async function handleDelete(service: ServiceData) {
    const confirmed = window.confirm(
      `Deseja realmente desativar o serviço "${service.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(service._id);

      const result = await deleteService(service._id);

      if (!result.success) {
        window.alert(result.error ?? "Não foi possível excluir o serviço.");

        return;
      }

      setServices((currentServices) =>
        currentServices.filter(
          (currentService) => currentService._id !== service._id,
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredServices = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      return services;
    }

    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term),
    );
  }, [services, search]);

  function handleServiceSaved(service: ServiceData) {
    setServices((currentServices) => {
      const exists = currentServices.some(
        (currentService) => currentService._id === service._id,
      );

      if (exists) {
        return currentServices.map((currentService) =>
          currentService._id === service._id ? service : currentService,
        );
      }

      return [service, ...currentServices];
    });
  }

  function handleEdit(service: ServiceData) {
    setEditingService(service);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingService(null);
  }

  return (
    <>
      <DashboardLayout
        title="Serviços"
        description="Gerencie os serviços oferecidos pelo seu negócio."
      >
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Seus serviços
              </h2>

              <p className="mt-1 text-xs text-zinc-400">
                Configure preços, duração e disponibilidade.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative w-full sm:w-56">
                <FiSearch
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar serviço..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none transition focus:border-[#635bff] focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setModalOpen(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 text-xs font-semibold text-white transition hover:bg-[#5148e8]"
              >
                <FiPlus size={14} />
                Novo serviço
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                className={`rounded-2xl border p-5 ${
                  service.active
                    ? "border-zinc-200"
                    : "border-zinc-100 bg-zinc-50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                    <FiClock size={17} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                      service.active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <h3 className="mt-5 text-sm font-semibold text-zinc-900">
                  {service.name}
                </h3>

                {service.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">
                    {service.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                  <span>{service.duration} min</span>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-zinc-100 pt-4">
                  <div>
                    <p className="text-[10px] text-zinc-400">Valor</p>

                    <p className="mt-1 text-base font-bold text-zinc-900">
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Editar ${service.name}`}
                      onClick={() => handleEdit(service)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <FiEdit2 size={14} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Excluir ${service.name}`}
                      onClick={() => handleDelete(service)}
                      disabled={deletingId === service._id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === service._id ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-500" />
                      ) : (
                        <FiTrash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full px-5 py-12 text-center">
                <FiClock size={22} className="mx-auto text-zinc-300" />

                <p className="mt-3 text-sm font-medium text-zinc-700">
                  {services.length === 0
                    ? "Nenhum serviço cadastrado"
                    : "Nenhum serviço encontrado"}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {services.length === 0
                    ? "Comece adicionando o primeiro serviço."
                    : "Tente buscar por outro nome."}
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <ServiceModal
        key={editingService?._id ?? "new"}
        open={modalOpen}
        onClose={handleModalClose}
        onCreated={handleServiceSaved}
        service={editingService}
      />
    </>
  );
}
