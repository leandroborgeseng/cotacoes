import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "Pré-cotação hospitalar",
  description: "Portal para fornecedores responderem pré-cotações com PDF e painel administrativo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Pré-cotação", statusBarStyle: "default" },
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
      <body className="min-h-full flex flex-col">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_-10%,oklch(0.72_0.14_255_/0.35),transparent_55%),radial-gradient(900px_circle_at_90%_10%,oklch(0.85_0.08_200_/0.35),transparent_55%)]" />
        <Providers>{children}</Providers>
        <Script id="prec-sw-register" strategy="afterInteractive">
          {`if ("serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(function () {}); }`}
        </Script>
      </body>
    </html>
  );
}
