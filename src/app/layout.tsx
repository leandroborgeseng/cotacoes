import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteTopNav } from "@/components/site/site-top-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pré-cotação Feira Hospitalar | São Joaquim",
  description:
    "Envie sua proposta em minutos: pré-cotação de equipamentos na Feira Hospitalar para o São Joaquim Hospital e Maternidade. Simples, claro e pensado para fornecedores.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Pré-cotação Feira", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_circle_at_15%_-5%,oklch(0.78_0.12_240_/0.28),transparent_50%),radial-gradient(800px_circle_at_95%_0%,oklch(0.88_0.09_195_/0.25),transparent_48%),linear-gradient(180deg,oklch(0.99_0.01_250),oklch(0.97_0.02_255))]" />
        <Providers>
          <div className="flex min-h-full flex-1 flex-col">
            <SiteTopNav />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
        <Script id="prec-sw-register" strategy="afterInteractive">
          {`if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(function () {}); }`}
        </Script>
      </body>
    </html>
  );
}
