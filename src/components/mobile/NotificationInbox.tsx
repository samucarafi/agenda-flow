"use client";

import Link from "next/link";
import { useState } from "react";
import { FiBell, FiCheck, FiChevronRight } from "react-icons/fi";

import { getMyNotifications, markNotificationAsRead } from "@/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = items.filter((item) => !item.read).length;

  async function toggleInbox() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (!nextOpen) return;

    setLoading(true);
    try {
      setItems(await getMyNotifications());
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await markNotificationAsRead(id);
    setItems((current) =>
      current.map((item) => item.id === id ? { ...item, read: true } : item),
    );
  }

  return (
    <div className="relative z-[60]">
      <button
        type="button"
        onClick={toggleInbox}
        aria-label="Abrir notificações"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
      >
        <FiBell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold text-slate-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default bg-black/20 md:bg-transparent"
          />
          <section
            role="dialog"
            aria-label="Central de notificações"
            className="fixed right-3 top-[4.75rem] z-[70] flex max-h-[min(34rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl shadow-black/40 sm:right-6"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notificações</p>
                <p className="text-[11px] text-slate-400">
                  {unread ? `${unread} não lida(s)` : "Tudo em dia"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <p className="px-4 py-8 text-center text-xs text-slate-400">Carregando...</p>
              ) : items.length ? (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={`border-b border-white/5 px-4 py-3 ${item.read ? "" : "bg-cyan-400/5"}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{item.body}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => void markRead(item.id)}
                          aria-label="Marcar como lida"
                          className="rounded-lg p-1.5 text-cyan-300 hover:bg-cyan-300/10"
                        >
                          <FiCheck size={14} />
                        </button>
                      )}
                    </div>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!item.read) void markRead(item.id);
                        setOpen(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      Ver detalhes <FiChevronRight size={12} />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-xs text-slate-400">
                  Você ainda não tem notificações.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
