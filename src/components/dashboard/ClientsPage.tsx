"use client";

import { useMemo, useState } from "react";
import { FiMail, FiPhone, FiPlus, FiSearch, FiUsers } from "react-icons/fi";

import { DashboardLayout } from "./DashboardLayout";
import { NewClientModal } from "./NewClientModal";

type ClientData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
};

interface ClientsPageProps {
  clients: ClientData[];
}

export function ClientsPage({ clients: initialClients }: ClientsPageProps) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      return clients;
    }

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term),
    );
  }, [clients, search]);

  function handleClientCreated(client: ClientData) {
    setClients((currentClients) => [client, ...currentClients]);
  }

  return (
    <>
      <DashboardLayout
        title="Clientes"
        description="Gerencie os clientes do seu negócio."
      >
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <FiSearch
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs outline-none transition focus:border-[#635bff] focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 text-xs font-semibold text-white transition hover:bg-[#5148e8]"
            >
              <FiPlus size={14} />
              Novo cliente
            </button>
          </div>

          <div className="divide-y divide-zinc-100">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#635bff]/10 text-xs font-semibold text-[#635bff]">
                    {client.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-800">
                      {client.name}
                    </p>

                    <p className="truncate text-xs text-zinc-400">
                      Cliente cadastrado
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs text-zinc-500 sm:w-64">
                  <span className="flex min-w-0 items-center gap-2">
                    <FiMail size={13} className="shrink-0" />

                    <span className="truncate">{client.email}</span>
                  </span>

                  <span className="flex items-center gap-2">
                    <FiPhone size={13} className="shrink-0" />

                    {client.phone}
                  </span>
                </div>

                <div className="sm:w-24">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
                    Ativo
                  </span>
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="px-5 py-12 text-center">
                <FiUsers size={22} className="mx-auto text-zinc-300" />

                <p className="mt-3 text-sm font-medium text-zinc-700">
                  {clients.length === 0
                    ? "Nenhum cliente cadastrado"
                    : "Nenhum cliente encontrado"}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {clients.length === 0
                    ? "Comece adicionando o primeiro cliente."
                    : "Tente buscar por outro nome ou e-mail."}
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <NewClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleClientCreated}
      />
    </>
  );
}
