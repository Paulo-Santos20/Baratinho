import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baratinho | Melhores Ofertas",
  description: "As melhores pechinchas e cupons da internet.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* TAG DE VERIFICAÇÃO DA LOMADEE */}
        <meta name="lomadee" content="2324685" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}