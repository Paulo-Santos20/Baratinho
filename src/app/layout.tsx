import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Importar o nosso Provider
import { AuthProvider } from "@/contexts/AuthContext"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baratinho | Melhores Ofertas",
  description: "As melhores pechinchas e cupões da internet.",
  // Verificações para os motores de busca e redes de afiliados
  other: {
    "lomadee": "2324685",
    "verify-admitad": "21ed3cb656", // NOME EXATO EXIGIDO PELO ROBÔ
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Verificação Lomadee (Mantida) */}
        <meta name="lomadee" content="2324685" />
        
        {/* Verificação Admitad (Corrigida) */}
        <meta name="verify-admitad" content="21ed3cb656" />
      </head>
      <body className={inter.className}>
        {/* Envolvemos o children com o AuthProvider para gerenciar login/sessão */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}