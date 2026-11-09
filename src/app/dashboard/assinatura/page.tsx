import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import { cancelSubscription, startSubscriptionCheckout } from "@/actions/subscription";
import { getOwnerEntitlement, hasUnlimitedOwnerAccess } from "@/lib/subscription";
import { mercadoPagoConfigured } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ cancelado?: string; erro?: string; aviso?: string; retorno?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.role !== "owner") redirect("/cliente");
  await connectToDatabase();
  const [subscription, unlimited] = await Promise.all([
    (async () => {
      await getOwnerEntitlement(user.id, user.email); // reconcilia teste/plano expirado antes de exibir o status
      return Subscription.findOne({ ownerId: user.id }).lean();
    })(),
    hasUnlimitedOwnerAccess(user.id, user.email),
  ]);
  const params = await searchParams;
  const trialExpired = subscription?.status === "expired" || (subscription?.status === "trialing" && new Date(subscription.trialEndsAt).getTime() <= Date.now());
  const remaining = subscription?.trialEndsAt ? Math.max(0, Math.ceil((new Date(subscription.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;
  const trialDate = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString("pt-BR") : "—";
  const configured = mercadoPagoConfigured();

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">← Voltar ao painel</Link>
    <h1 className="mt-6 text-3xl font-bold">Minha assinatura</h1><p className="mt-2 text-slate-400">Gerencie seu plano, empreendimentos e pagamentos.</p>
    {params.cancelado && <p className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200">Solicitação de cancelamento concluída. Nenhuma nova recorrência será criada; o acesso permanece até o fim do período já pago, quando aplicável.</p>}
    {params.aviso === "acesso-bloqueado" && <p className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-100">O acesso aos recursos do empreendimento está pausado porque o teste ou período contratado terminou. Seus dados e cadastros foram preservados.</p>}
    {params.erro && <p role="alert" className="mt-5 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-200">Não foi possível concluir esta operação ({params.erro}). Confira as configurações ou fale com o suporte.</p>}
    {params.retorno && <p className="mt-5 rounded-xl bg-indigo-500/10 p-4 text-sm text-indigo-200">Retorno recebido. A confirmação da assinatura depende da notificação validada do Mercado Pago.</p>}
    {unlimited ? <section className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Acesso de testes / legado</p><h2 className="mt-2 text-2xl font-bold">Acesso ilimitado habilitado</h2><p className="mt-2 text-sm leading-6 text-slate-300">Esta conta mantém acesso a múltiplos empreendimentos sem cobrança para preservar os cadastros e testes anteriores. Essa exceção não é oferecida em novos cadastros.</p></section> :
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-400">Plano completo</p><p className="mt-1 text-2xl font-bold">AgendaFlow</p></div><span className="rounded-full bg-indigo-400/15 px-3 py-1 text-xs font-semibold text-indigo-200">{trialExpired ? "Teste expirado" : subscription?.status === "trialing" ? "Teste grátis" : subscription?.status === "active" ? "Ativa" : subscription?.status === "cancelled" ? "Cancelada" : subscription?.status === "pending_payment" ? "Aguardando pagamento" : subscription?.status === "past_due" ? "Pagamento pendente" : subscription?.status ?? "Sem assinatura"}</span></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">Teste termina em</p><p className="mt-1 text-lg font-semibold">{trialDate}</p><p className="mt-1 text-sm text-slate-400">{remaining} dia(s) restante(s)</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">Preço do plano</p><p className="mt-1 text-lg font-semibold">R$ 39,90/mês</p><p className="mt-1 text-sm text-slate-400">ou R$ 399,00/ano</p></div></div>
      <div className="mt-6 rounded-xl border border-white/10 p-4"><p className="font-semibold">Empreendimentos</p><p className="mt-1 text-sm text-slate-400">1 incluído. Cada adicional: R$ 19,90/mês ou R$ 199,00/ano.</p></div>
      {subscription?.status === "trialing" && !trialExpired && <p className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-100">Seu teste é gratuito e não exige cartão. Ao terminar, nenhuma cobrança será feita automaticamente. Você escolhe se deseja contratar.</p>}
      {configured && subscription && subscription.status !== "active" && <form action={startSubscriptionCheckout} className="mt-6 space-y-4 rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4">
        <h2 className="font-semibold">Escolha sua contratação</h2>
        <label className="block text-sm text-slate-300">Periodicidade<select name="interval" className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white"><option value="month">Mensal — R$ 39,90</option><option value="year">Anual — R$ 399,00</option></select></label>
        <label className="block text-sm text-slate-300">Empreendimentos adicionais<select name="additionalBusinesses" defaultValue="0" className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-white">{Array.from({length: 11},(_,i)=><option key={i} value={i}>{i} adicional(is)</option>)}</select></label>
        <p className="text-xs leading-5 text-slate-400">Adicional: R$ 19,90 por mês ou R$ 199,00 por ano, por empreendimento. O valor total será exibido no checkout do Mercado Pago.</p>
        <button className="h-12 w-full rounded-xl bg-[#009ee3] px-5 text-sm font-bold text-white hover:bg-[#008bc7]">Continuar para Mercado Pago</button>
      </form>}
      {!configured && <p className="mt-5 rounded-xl bg-amber-400/10 p-4 text-sm text-amber-100">O checkout ainda não está configurado. O administrador precisa definir as credenciais e o segredo do webhook no ambiente de produção.</p>}
      {subscription?.status === "active" && <div className="mt-6"><p className="text-sm text-slate-300">Cobrança recorrente gerenciada pelo Mercado Pago.{subscription.currentPeriodEndsAt ? ` Período atual até ${new Date(subscription.currentPeriodEndsAt).toLocaleDateString("pt-BR")}.` : ""}</p><form action={cancelSubscription} className="mt-4"><button className="rounded-xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">Cancelar assinatura</button></form></div>}
      {subscription && (subscription.status === "pending_payment" || (subscription.status === "trialing" && Boolean(subscription.providerSubscriptionId)) || subscription.status === "past_due") && <form action={cancelSubscription} className="mt-6"><button className="rounded-xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-400/10">Cancelar contratação pendente</button></form>}
    </section>}
    <p className="mt-6 text-xs leading-5 text-slate-500">O cancelamento impede novas cobranças recorrentes. Direitos legais de arrependimento e solicitações de reembolso são tratados conforme a legislação aplicável e os termos publicados. Seus dados não são apagados automaticamente.</p>
  </div></main>;
}
