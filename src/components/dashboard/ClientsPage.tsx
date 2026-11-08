"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  FiCopy,
  FiKey,
  FiMail,
  FiPhone,
  FiPlus,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

import { resetClientTemporaryPassword } from "@/actions/clients";
import { DashboardLayout } from "./DashboardLayout";
import { NewClientModal } from "./NewClientModal";

type ClientData = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
  hasAccount: boolean;
  mustChangePassword: boolean;
};

interface ClientsPageProps {
  businessId: string;
  clients: ClientData[];
}

export function ClientsPage({
  businessId,
  clients: initialClients,
}: ClientsPageProps) {
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [isResetting, startReset] = useTransition();

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return clients;

    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term),
    );
  }, [clients, search]);

  const handleClientCreated = useCallback(
    (client: ClientData, alreadyExists = false, accountCreated = false) => {
      setClients((current) => [
        client,
        ...current.filter((item) => item._id !== client._id),
      ]);
      setNotice(
        accountCreated
          ? "Cliente e novo acesso criados. Entregue a senha temporária ao cliente."
          : alreadyExists
            ? "Perfil existente vinculado a este negócio. A senha da conta não foi alterada."
            : "Cliente vinculado a uma conta existente. A senha atual foi preservada.",
      );
    },
    [],
  );

  function handleResetPassword(client: ClientData) {
    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("clientId", client._id);

    setCredentials(null);
    setCopyMessage("");
    setNotice("");

    startReset(async () => {
      const result = await resetClientTemporaryPassword(formData);

      if (!result.success) {
        setNotice(result.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setCredentials({
        email: result.email,
        password: result.temporaryPassword,
      });
      setClients((current) =>
        current.map((item) =>
          item._id === client._id
            ? { ...item, mustChangePassword: true }
            : item,
        ),
      );
      setNotice("Nova senha temporária criada. A senha anterior foi invalidada.");
    });
  }

  async function copyCredentials() {
    if (!credentials) return;

    try {
      await navigator.clipboard.writeText(
        `E-mail: ${credentials.email}\nSenha temporária: ${credentials.password}`,
      );
      setCopyMessage("Credenciais copiadas.");
    } catch {
      setCopyMessage("Não foi possível copiar automaticamente. Copie os dados manualmente.");
    }
  }

  return (
    <>
      <DashboardLayout
        title="Clientes"
        description="Gerencie os clientes e os acessos vinculados ao seu negócio."
        backHref={`/dashboard/negocios/${businessId}`}
        backLabel="Voltar ao negócio"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {notice && (
            <p role="status" className="border-b border-zinc-100 px-5 py-3 text-xs text-zinc-600">
              {notice}
            </p>
          )}

          {credentials && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <p className="font-semibold">Senha temporária — entregue ao cliente agora</p>
              <p className="mt-2 break-all">E-mail: <strong>{credentials.email}</strong></p>
              <p className="break-all">
                Senha: <strong className="font-mono">{credentials.password}</strong>
              </p>
              <p className="mt-2 text-xs leading-5">
                A senha só será exibida nesta tela enquanto este aviso estiver aberto.
                No próximo acesso, o cliente precisará escolher uma senha pessoal.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white hover:bg-amber-800"
                >
                  <FiCopy size={13} />
                  Copiar credenciais
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCredentials(null);
                    setCopyMessage("");
                  }}
                  className="h-9 rounded-lg px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Ocultar senha
                </button>
                {copyMessage && <span className="text-xs">{copyMessage}</span>}
              </div>
            </div>
          )}

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
                    <p className="truncate text-sm font-semibold text-zinc-800">{client.name}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {!client.hasAccount
                        ? "Sem conta de acesso"
                        : client.mustChangePassword
                          ? "Aguardando troca de senha"
                          : "Conta de acesso ativa"}
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
                    {client.phone || "Telefone não informado"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">
                    Ativo
                  </span>
                  {client.hasAccount && (
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={() => handleResetPassword(client)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-600 transition hover:border-[#635bff] hover:text-[#635bff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiKey size={13} />
                      {isResetting ? "Gerando..." : "Redefinir senha"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="px-5 py-12 text-center">
                <FiUsers size={22} className="mx-auto text-zinc-300" />
                <p className="mt-3 text-sm font-medium text-zinc-700">
                  {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
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
        businessId={businessId}
      />
    </>
  );
}
