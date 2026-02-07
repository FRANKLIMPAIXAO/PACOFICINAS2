import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PAC Oficinas - Sistema de Gestão para Oficinas",
  description: "Sistema de gestão simples e intuitivo para oficinas mecânicas e autopeças",
  keywords: ["oficina mecânica", "gestão", "ordem de serviço", "estoque", "autopeças"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
