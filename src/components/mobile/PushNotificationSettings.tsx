"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import { FiBell } from "react-icons/fi";

import { registerPushDevice } from "@/actions/push-devices";

const subscribe = () => () => undefined;
const getNativeSnapshot = () => Capacitor.isNativePlatform();
const getServerSnapshot = () => false;

export function PushNotificationSettings() {
  const router = useRouter();
  const isNative = useSyncExternalStore(subscribe, getNativeSnapshot, getServerSnapshot);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isNative) return;

    let registrationListener: PluginListenerHandle | undefined;
    let actionListener: PluginListenerHandle | undefined;
    let active = true;

    void (async () => {
      registrationListener = await PushNotifications.addListener(
        "registration",
        async ({ value }) => {
          localStorage.setItem("agenda_flow_push_token", value);
          const result = await registerPushDevice({
            token: value,
            platform: Capacitor.getPlatform() === "ios" ? "ios" : "android",
          });

          if (active) {
            setStatus(
              result.success
                ? "Notificações ativadas neste dispositivo."
                : result.error ?? "Não foi possível registrar o dispositivo.",
            );
            setPending(false);
          }
        },
      );

      actionListener = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        ({ notification }) => {
          const target = notification.data?.href;
          if (typeof target === "string" && target.startsWith("/") && !target.startsWith("//")) {
            router.push(target);
          }
        },
      );
    })();

    return () => {
      active = false;
      void registrationListener?.remove();
      void actionListener?.remove();
    };
  }, [isNative, router]);

  if (!isNative) return null;

  async function enableNotifications() {
    setPending(true);
    setStatus("");

    try {
      let permission = await PushNotifications.checkPermissions();

      if (permission.receive !== "granted") {
        permission = await PushNotifications.requestPermissions();
      }

      if (permission.receive !== "granted") {
        setStatus("Permissão de notificações não concedida.");
        setPending(false);
        return;
      }

      await PushNotifications.createChannel({
        id: "agendaflow-updates",
        name: "Atualizações do AgendaFlow",
        description: "Agendamentos, fila de espera e avisos do estabelecimento.",
        importance: 4,
        visibility: 1,
        sound: "default",
      });

      await PushNotifications.register();
      setStatus("Conectando este dispositivo...");
    } catch (error) {
      console.error("enableNotifications:", error);
      setStatus("Não foi possível ativar notificações. Verifique a configuração do aplicativo.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={enableNotifications}
        disabled={pending}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
      >
        <FiBell size={14} />
        {pending ? "Ativando..." : "Ativar notificações"}
      </button>
      {status && (
        <p role="status" className="max-w-64 text-right text-[11px] text-slate-400">
          {status}
        </p>
      )}
    </div>
  );
}
