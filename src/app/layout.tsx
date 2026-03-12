import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
// AQUI ESTÁ A MÁGICA: Importamos o Footer uma única vez
import Footer from "@/components/Footer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baratinho | As melhores ofertas da internet",
  description: "Garimpamos os maiores descontos e cupons para você.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          
          {/* Esta div com 'min-h-screen' e 'flex-col' garante que o seu Footer 
            fique sempre grudado no final da tela, mesmo se a página tiver pouco conteúdo.
            Isso é UI/UX de Excelência!
          */}
          <div className="flex flex-col min-h-screen">
            
            {/* O 'children' representa todas as páginas do seu site (Home, Produto, etc) */}
            <div className="flex-grow">
              {children}
            </div>
            
            {/* O Footer colocado aqui embaixou aparecerá em todo o site automaticamente */}
            <Footer />
            
          </div>

        </AuthProvider>
      </body>
    </html>
  );
}