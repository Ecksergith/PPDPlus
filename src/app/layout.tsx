import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PPD+ - Projeto Poupança Disponível",
  description: "Sistema de gestão de crédito e poupança com taxas diferenciadas para membros e não-membros",
  keywords: ["PPD+", "Poupança", "Crédito", "Angola", "Sistema Financeiro"],
  authors: [{ name: "PPD+ Team" }],
  openGraph: {
    title: "PPD+ - Projeto Poupança Disponível",
    description: "Sistema de gestão de crédito e poupança com taxas diferenciadas",
    url: "https://ppdplus.ao",
    siteName: "PPD+",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PPD+ - Projeto Poupança Disponível",
    description: "Sistema de gestão de crédito e poupança",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
