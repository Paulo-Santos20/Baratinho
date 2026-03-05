import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, MessageCircle, X } from 'lucide-react';

export default function DealCard({ deal }: { deal: any }) {
  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Simulação de autenticação (No futuro, vira: const { user } = useAuth())
  const isUserLoggedIn = false; 

  const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.preco || 0);
  const precoAntigoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.precoAntigo || 0);
  const linkDestino = deal.slug ? `/p/${deal.slug}` : '#';

  const imagemFinal = imgError 
    ? "https://placehold.co/400x400/f8fafc/f97316?text=Indisponível" 
    : (deal.imagemUrl || "https://placehold.co/400x400/f8fafc/f97316?text=Baratinho");

  // Lógica de Comentários
  const qtdComentarios = deal.comentarios || 0; // Se a API não mandar, começa com 0
  const textoComentarios = qtdComentarios === 0 ? 'Comentar' : qtdComentarios === 1 ? '1 Comentário' : `${qtdComentarios} Comentários`;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede que o clique no coração abra o link da página
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setIsFavorite(!isFavorite);
  };

  return (
    <>
      {/* CARD PRINCIPAL (Mais compacto para evitar quebra no zoom) */}
      <div className="group bg-white rounded-[1.5rem] flex flex-col h-full overflow-hidden border border-slate-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 relative">
        
        {/* Imagem (Clicável) */}
        <Link href={linkDestino} className="relative aspect-square overflow-hidden bg-slate-50 flex items-center justify-center">
          <img 
            src={imagemFinal} 
            alt={deal.titulo || "Oferta Baratinho"} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Informações */}
        <div className="flex flex-col flex-grow p-4">
          <Link href={linkDestino} className="block mb-3">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1 block">
              {deal.loja || "Loja Parceira"}
            </span>
            <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-orange-500 transition-colors">
              {deal.titulo || "Produto sem título"}
            </h3>
          </Link>
          
          <div className="mt-auto">
            {deal.precoAntigo > deal.preco && (
              <span className="text-xs text-slate-400 line-through mb-0.5 block">
                {precoAntigoFormatado}
              </span>
            )}
            <span className="text-2xl font-black text-slate-900 tracking-tighter block mb-4">
              {precoFormatado}
            </span>
          </div>

          {/* FOOTER DO CARD: Ações Independentes */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            
            {/* Comentários */}
            <Link href={`${linkDestino}#comentarios`} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-500 transition-colors">
              <MessageCircle size={18} strokeWidth={2.5} />
              <span className="text-xs font-bold">{textoComentarios}</span>
            </Link>

            {/* Favoritar e Comprar */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleFavoriteClick}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90"
              >
                <Heart 
                  size={20} 
                  strokeWidth={2.5} 
                  className={isFavorite ? "fill-red-500 text-red-500" : ""} 
                />
              </button>
              
              <a 
                href={deal.urlAfiliado || linkDestino} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-orange-500 text-white p-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 active:scale-95"
              >
                <ShoppingBag size={18} strokeWidth={2.5} />
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL DE LOGIN (UI/UX de Excelência com Blur) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
            
            <div className="text-center mb-6 mt-2">
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                <Heart size={28} className="fill-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Quase lá!</h2>
              <p className="text-sm text-slate-500 font-medium">
                Faça login rapidinho para salvar as melhores pechinchas e não perder nenhuma queda de preço.
              </p>
            </div>

            <button 
              onClick={() => alert("Função de login via Google em breve!")}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors mb-3"
            >
              Entrar com Google
            </button>
            <button 
              onClick={() => setShowLoginModal(false)}
              className="w-full bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </>
  );
}