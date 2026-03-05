"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, MessageCircle, X } from 'lucide-react';
// IMPORTAÇÃO DA AUTENTICAÇÃO
import { useAuth } from '@/contexts/AuthContext'; 

export default function DealCard({ deal, viewMode = 'grid' }: { deal: any, viewMode?: 'grid' | 'list' }) {
  const { user, signInWithGoogle } = useAuth(); // PUXA OS DADOS REAIS DO GOOGLE
  const isUserLoggedIn = !!user;

  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isList = viewMode === 'list';

  const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.preco || 0);
  const precoAntigoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.precoAntigo || 0);
  const linkDestino = deal.slug ? `/p/${deal.slug}` : '#';

  const imagemFinal = imgError 
    ? "https://placehold.co/400x400/f8fafc/f97316?text=Indisponível" 
    : (deal.imagemUrl || "https://placehold.co/400x400/f8fafc/f97316?text=Baratinho");

  const qtdComentarios = deal.comentarios || 0;
  const textoComentarios = qtdComentarios === 0 ? 'Comentar' : qtdComentarios === 1 ? '1 Comentário' : `${qtdComentarios} Comentários`;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    // No futuro, isso salvará no Firebase
    setIsFavorite(!isFavorite); 
  };

  const handleLoginNoModal = async () => {
    await signInWithGoogle();
    setShowLoginModal(false); // Fecha o modal assim que o Google retornar sucesso
  };

  return (
    <>
      <div className={`group bg-white rounded-[1.5rem] flex ${isList ? 'flex-col sm:flex-row' : 'flex-col'} h-full overflow-hidden border border-slate-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 relative`}>
        <Link href={linkDestino} className={`relative overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0 ${isList ? 'aspect-video sm:aspect-square sm:w-56 sm:border-r border-slate-100' : 'aspect-square'}`}>
          <img src={imagemFinal} alt={deal.titulo || "Oferta"} onError={() => setImgError(true)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>

        <div className={`flex flex-col flex-grow ${isList ? 'p-6' : 'p-4'}`}>
          <Link href={linkDestino} className="block mb-3">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1 block">{deal.loja || "Loja Parceira"}</span>
            <h3 className={`font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors ${isList ? 'text-base sm:text-lg mb-2' : 'text-sm min-h-[2.5rem]'}`}>{deal.titulo || "Produto sem título"}</h3>
          </Link>
          
          <div className="mt-auto">
            {deal.precoAntigo > deal.preco && <span className="text-xs text-slate-400 line-through mb-0.5 block">{precoAntigoFormatado}</span>}
            <span className={`font-black text-slate-900 tracking-tighter block mb-4 ${isList ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>{precoFormatado}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <Link href={`${linkDestino}#comentarios`} className="flex items-center gap-1.5 text-slate-400 hover:text-orange-500 transition-colors">
              <MessageCircle size={18} strokeWidth={2.5} />
              <span className="text-xs font-bold">{textoComentarios}</span>
            </Link>

            <div className="flex items-center gap-2">
              <button onClick={handleFavoriteClick} className="p-2 text-slate-300 hover:text-red-500 transition-colors active:scale-90">
                <Heart size={20} strokeWidth={2.5} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              </button>
              
              <a href={deal.urlAfiliado || linkDestino} target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-100 active:scale-95 flex items-center gap-2">
                <ShoppingBag size={18} strokeWidth={2.5} />
                {isList && <span className="font-bold text-sm hidden sm:block">Comprar</span>}
              </a>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full transition-colors">
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="text-center mb-6 mt-2">
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                <Heart size={28} className="fill-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Quase lá!</h2>
              <p className="text-sm text-slate-500 font-medium">Faça login rapidinho para salvar as melhores pechinchas.</p>
            </div>
            
            {/* BOTÃO REAL DE LOGIN DO GOOGLE */}
            <button 
              onClick={handleLoginNoModal} 
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors mb-3 flex items-center justify-center gap-2"
            >
              <UserCircle size={20} /> Entrar com Google
            </button>
            
            <button onClick={() => setShowLoginModal(false)} className="w-full bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-colors">
              Agora não
            </button>
          </div>
        </div>
      )}
    </>
  );
}