import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { mercadoPagoRequest, validateMercadoPagoSignature, type MercadoPagoPreapproval } from "@/lib/mercado-pago";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dataId = String(request.nextUrl.searchParams.get("data.id") ?? body?.data?.id ?? "");
  const valid = validateMercadoPagoSignature({
    signature: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  if (!dataId) return NextResponse.json({ received: true });

  try {
    const eventType = String(body?.type ?? request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic") ?? "");
    await connectToDatabase();

    if (eventType === "subscription_authorized_payment") {
      const invoice = await mercadoPagoRequest<{ preapproval_id?: string; status?: string }>(`/authorized_payments/${encodeURIComponent(dataId)}`);
      if (!invoice.preapproval_id) return NextResponse.json({ received: true });
      const subscription = await Subscription.findOne({ providerSubscriptionId: invoice.preapproval_id });
      if (!subscription) return NextResponse.json({ received: true });
      if (invoice.status === "approved") {
        const preapproval = await mercadoPagoRequest<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`);
        // Uma cobrança aprovada ativa o plano; a próxima data de cobrança fecha o período atual.
        subscription.status = "active";
        if (preapproval.next_payment_date) {
          const periodEnd = new Date(preapproval.next_payment_date);
          if (!Number.isNaN(periodEnd.getTime())) subscription.currentPeriodEndsAt = periodEnd;
        }
        if (subscription.pendingBillingInterval) subscription.billingInterval = subscription.pendingBillingInterval;
        if (typeof subscription.pendingAdditionalBusinesses === "number") subscription.additionalBusinesses = subscription.pendingAdditionalBusinesses;
        if (typeof subscription.pendingAmountCents === "number") subscription.amountCents = subscription.pendingAmountCents;
        subscription.pendingBillingInterval = undefined;
        subscription.pendingAdditionalBusinesses = undefined;
        subscription.pendingAmountCents = undefined;
      } else if (invoice.status === "rejected" || invoice.status === "cancelled") {
        subscription.status = "past_due";
      }
      subscription.lastWebhookAt = new Date();
      await subscription.save();
      return NextResponse.json({ received: true });
    }

    const preapproval = await mercadoPagoRequest<MercadoPagoPreapproval>(`/preapproval/${encodeURIComponent(dataId)}`);
    if (!preapproval.external_reference) return NextResponse.json({ received: true });
    const subscription = await Subscription.findOne({
      ownerId: preapproval.external_reference,
      providerSubscriptionId: preapproval.id,
    });
    if (!subscription) return NextResponse.json({ received: true });

    // Só a consulta autenticada à API do Mercado Pago determina o status final.
    if (preapproval.status === "authorized") {
      // Autorização da recorrência não comprova pagamento. Mantém o teste grátis
      // até seu fim ou aguarda a primeira cobrança quando o teste já expirou.
      subscription.status = subscription.trialEndsAt.getTime() > Date.now() && !subscription.billingInterval
        ? "trialing"
        : "pending_payment";
    } else if (preapproval.status === "cancelled" || preapproval.status === "canceled") {
      const trialStillValid = subscription.trialEndsAt.getTime() > Date.now();
      const hasPaidPlan = Boolean(subscription.billingInterval && typeof subscription.amountCents === "number");
      if (trialStillValid && !hasPaidPlan) {
        subscription.status = "trialing";
        subscription.providerSubscriptionId = undefined;
        subscription.provider = "none";
        subscription.pendingBillingInterval = undefined;
        subscription.pendingAdditionalBusinesses = undefined;
        subscription.pendingAmountCents = undefined;
        subscription.cancelledAt = undefined;
      } else {
        subscription.status = "cancelled";
        subscription.cancelledAt = new Date();
      }
    } else if (preapproval.status === "paused") {
      subscription.status = "past_due";
    } else if (preapproval.status === "pending") {
      subscription.status = "pending_payment";
    }
    subscription.lastWebhookAt = new Date();
    await subscription.save();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook:", error);
    return NextResponse.json({ error: "Falha ao processar notificação." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido." }, { status: 405 });
}
