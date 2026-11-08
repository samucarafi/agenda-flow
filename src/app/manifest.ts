import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AgendaFlow",
    short_name: "AgendaFlow",
    description: "Agendamentos, clientes e fila de espera em um só lugar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080d1b",
    theme_color: "#080d1b",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/agendaflow.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
