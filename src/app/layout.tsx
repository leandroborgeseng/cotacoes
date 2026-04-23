import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  title: "Cotações — Equipamentos hospitalares",
  description: "Gestão simples de cotação de equipamentos hospitalares com importação JSON e exportação CSV.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_-10%,oklch(0.72_0.14_255_/0.35),transparent_55%),radial-gradient(900px_circle_at_90%_10%,oklch(0.85_0.08_200_/0.35),transparent_55%)]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
