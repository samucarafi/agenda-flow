"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { mercadoPagoRequest, type MercadoPagoPreapproval } from "@/lib/mercado-pago";
import { hasUnlimitedOwnerAccess } from "@/lib/subscription";

const checkoutSchema = z.object({
  interval: z.enum(["month", "year"]),
  additionalBusinesses: z.coerce.number().int().min(0).max(50),
});

export async function startSubscriptionCheckout(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");
  if (await hasUnlimitedOwnerAccess(user.id, user.email)) redirect("/dashboard/assinatura?aviso=acesso-ilimitado");

  const parsed = checkoutSchema.safeParse({
    interval: formData.get("interval"),
    additionalBusinesses: formData.get("additionalBusinesses") ?? "0",
  });
  if (!parsed.success) redirect("/dashboard/assinatura?erro=opcoes");

  await connectToDatabase();
  const subscription = await Subscription.findOne({ ownerId: user.id });
  if (!subscription) redirect("/dashboard/assinatura?erro=assinatura");
  if (subscription.status === "active" && subscription.providerSubscriptionId) {
    redirect("/dashboard/assinatura?erro=ja-ativa");
  }

  const { interval, additionalBusinesses } = parsed.data;
  const base = interval === "month" ? 3990 : 39900;
  const extra = interval === "month" ? 1990 : 19900;
  const amountCents = base + extra * additionalBusinesses;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !/^https:\/\//.test(appUrl)) redirect("/dashboard/assinatura?erro=configuracao");

  try {
    const response = await mercadoPagoRequest<MercadoPagoPreapproval>("/preapproval", {
      method: "POST",
      headers: { "X-Idempotency-Key": randomUUID() },
      body: JSON.stringify({
        reason: `AgendaFlow - plano ${interval === "month" ? "mensal" : "anual"} (${1 + additionalBusinesses} empreendimento(s))`,
        external_reference: user.id,
        payer_email: user.email,
        auto_recurring: {
          frequency: interval === "month" ? 1 : 12,
          frequency_type: "months",
          transaction_amount: amountCents / 100,
          currency_id: "BRL",
        },
        back_url: `${appUrl}/dashboard/assinatura?retorno=mercadopago`,
        status: "pending",
      }),
    });
    if (!response.id || !response.init_point) throw new Error("Resposta inválida do Mercado Pago.");
    subscription.status = "pending_payment";
    subscription.provider = "mercado_pago";
    subscription.providerSubscriptionId = response.id;
    subscription.pendingBillingInterval = interval;
    subscription.pendingAdditionalBusinesses = additionalBusinesses;
    subscription.pendingAmountCents = amountCents;
    await subscription.save();
    redirect(response.init_point);
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("startSubscriptionCheckout:", error);
    redirect("/dashboard/assinatura?erro=mercadopago");
  }
}

export async function cancelSubscription() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");
  if (await hasUnlimitedOwnerAccess(user.id, user.email)) redirect("/dashboard/assinatura?aviso=acesso-ilimitado");

  await connectToDatabase();
  const subscription = await Subscription.findOne({ ownerId: user.id });
  if (!subscription) redirect("/dashboard/assinatura?erro=nao-encontrada");

  try {
    if (subscription.providerSubscriptionId && subscription.provider === "mercado_pago" && subscription.status !== "cancelled") {
      await mercadoPagoRequest(`/preapproval/${encodeURIComponent(subscription.providerSubscriptionId)}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      });
    }
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();
    revalidatePath("/dashboard/assinatura");
    redirect("/dashboard/assinatura?cancelado=1");
  } catch (error) {
    if (typeof error === "object" && error !== null && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    console.error("cancelSubscription:", error);
    redirect("/dashboard/assinatura?erro=cancelamento");
  }
}

export async function cancelTrial() {
  return cancelSubscription();
}
