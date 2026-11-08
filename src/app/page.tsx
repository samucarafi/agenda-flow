import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  const navbarUser = user
    ? {
        role: user.role === "owner" ? ("owner" as const) : ("client" as const),
      }
    : null;

  return (
    <main className="home-page min-h-screen bg-slate-950 text-white">
      <Navbar user={navbarUser} />
      <Hero />
      <HowItWorks />
      <Features />
      <footer className="border-t border-white/10 bg-slate-950 px-5 py-8 text-sm text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AgendaFlow. Todos os direitos reservados.</p>
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/termos" className="hover:text-white">Termos de Uso</a>
            <a href="/privacidade" className="hover:text-white">Privacidade</a>
            <a href="/contato" className="hover:text-white">Ajuda e contato</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
