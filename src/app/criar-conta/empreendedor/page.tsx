import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OwnerSignupForm } from "@/components/billing/OwnerSignupForm";

export const metadata = { title: "Comece grátis — AgendaFlow" };
export default async function OwnerSignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "owner" ? "/dashboard" : "/cliente");
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white"><div className="w-full max-w-lg"><Link href="/" className="text-sm text-slate-400 hover:text-white">← Voltar</Link><div className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-9"><p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-300">AgendaFlow para negócios</p><h1 className="mt-3 text-3xl font-bold">30 dias por nossa conta.</h1><p className="mt-3 mb-7 text-sm leading-6 text-slate-400">Teste o plano completo com um empreendimento. Não pedimos cartão e não existe cobrança automática ao final do período.</p><OwnerSignupForm /><p className="mt-6 text-center text-sm text-slate-500">Já tem uma conta? <Link href="/entrar" className="text-indigo-300">Entrar</Link></p></div></div></main>;
}
