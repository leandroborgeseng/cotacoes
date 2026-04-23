import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pré-Cotação Hospitalar",
    short_name: "Pré-Cotação",
    description: "Portal de pré-cotação para fornecedores hospitalares.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    lang: "pt-BR",
    orientation: "portrait-primary",
    icons: [{ src: "/file.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
