import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Importar o nosso Provider
import { AuthProvider } from "@/contexts/AuthContext"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baratinho | Melhores Ofertas",
  description: "As melhores pechinchas e cupões da internet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <head>
        <meta name="lomadee" content="2324685" />
      </head>
      <body className={inter.className}>
        {/* Envolvemos o children com o AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}