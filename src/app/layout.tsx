import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

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
  description: "Aplicativo móvel para consulta de créditos acumulados do Projeto Poupança Disponível (PPD)",
  keywords: ["PPD+", "PPD", "Poupança", "Créditos", "Finanças", "Aplicativo Móvel"],
  authors: [{ name: "PPD+ Team" }],
  openGraph: {
    title: "PPD+ - Projeto Poupança Disponível",
    description: "Consulta segura de créditos acumulados",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PPD+ - Projeto Poupança Disponível",
    description: "Consulta segura de créditos acumulados",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
