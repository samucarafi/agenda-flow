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
    <main>
      <Navbar user={navbarUser} />
      <Hero />
      <HowItWorks />
      <Features />
    </main>
  );
}
