"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, MessageCircle, X, UserCircle, Clock, Tag, ShieldCheck, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 

// ENGRENAGEM DE TEMPO (Calcula a idade da oferta)
const formatTimeAgo = (dateInput: any) => {
  if (!dateInput) return '';
  const date = dateInput._seconds ? new Date(dateInput._seconds * 1000) : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Agora mesmo';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} h`;
  if (diffInHours < 48) return `Ontem`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Há ${diffInDays} dias`;
};

export default function DealCard({ deal }: { deal: any }) {
  const { user, signInWithGoogle } = useAuth();
  const isUserLoggedIn = !!user;

  const [imgError, setImgError] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.preco || 0);
  const precoAntigoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.precoAntigo || 0);
  const linkDestino = deal.slug ? `/p/${deal.slug}` : '#';

  const imagemFinal = imgError 
    ? "https://placehold.co/400x400/f8fafc/f97316?text=Indisponível" 
    : (deal.imagemUrl || "https://placehold.co/400x400/f8fafc/f97316?text=Baratinho");

  const tempoAtras = formatTimeAgo(deal.dataCriacao);

  const temDesconto = deal.precoAntigo > deal.preco;
  const porcentagemDesconto = temDesconto ? Math.round(((deal.precoAntigo - deal.preco) / deal.precoAntigo) * 100) : 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!isUserLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setIsFavorite(!isFavorite); 
  };

  const handleLoginNoModal = async () => {
    await signInWithGoogle();
    setShowLoginModal(false); 
  };

  return (
    <>
      <div className="group bg-white rounded-[1.5rem] flex flex-col h-full overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 relative">
        
        {/* IMAGEM E SELOS */}
        <Link href={linkDestino} className="relative overflow-hidden bg-white flex items-center justify-center flex-shrink-0 aspect-square border-b border-slate-50">
          <img src={imagemFinal} alt={deal.titulo || "Oferta"} onError={() => setImgError(true)} className="max-h-full max-w-full object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
          
          {temDesconto && (
            <div className="absolute top-3 left-3 bg-red-500 text-white font-black px-2 py-1 rounded-lg text-[10px] shadow-sm flex items-center gap-1">
              <TrendingDown size={12} /> -{porcentagemDesconto}%
            </div>
          )}

          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {/* Correção do Avatar: Evitando erros se a foto do usuário não existir */}
            {deal.usuarioPostadorPhoto && (
              <img src={deal.usuarioPostadorPhoto} alt="Postador" className="w-7 h-7 rounded-full border border-slate-200 bg-white" />
            )}
            <button onClick={handleFavoriteClick} className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-slate-300 hover:text-red-500 transition active:scale-90 border border-slate-100 shadow-sm">
              <Heart size={16} strokeWidth={2.5} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </Link>

        {/* INFORMAÇÕES DO PRODUTO */}
        <div className="flex flex-col flex-grow p-4">
          <Link href={linkDestino} className="block flex-grow">
            
            {/* LOJA E TEMPO */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-slate-100 bg-white p-0.5">
                <img src={deal.lojaLogoUrl || `https://logo.clearbit.com/${deal.loja?.toLowerCase().replace(/\s/g, '')}.com`} onError={(e) => e.currentTarget.style.display = 'none'} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  {/* Fonte da loja bem menor e com truncate para não quebrar a linha */}
                  <span className="text-[10px] font-bold text-slate-700 truncate block leading-none">{deal.loja || "Loja Parceira"}</span>
                  {deal.lojaVerificada && <ShieldCheck size={12} className="text-emerald-500 flex-shrink-0" strokeWidth={2.5} />}
                </div>
                {tempoAtras && (
                  <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5 mt-0.5 leading-none">
                    <Clock size={10} strokeWidth={2.5} /> {tempoAtras}
                  </span>
                )}
              </div>
            </div>
            
            {/* TÍTULO DO PRODUTO (Menor para caber perfeitamente) */}
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-orange-500 transition-colors mb-2">
              {deal.titulo || "Produto sem título"}
            </h3>

            {/* ÁREA DE CUPOM */}
            {deal.cupom && (
              <div className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100 font-bold uppercase text-[9px] tracking-wider mb-2">
                <Tag size={10} strokeWidth={2.5} />
                {deal.cupom}
              </div>
            )}
          </Link>
          
          {/* ÁREA DE PREÇO E COMPRA */}
          {/* min-w-0 é crucial aqui para evitar que o preço expulse o botão */}
          <div className="pt-3 border-t border-slate-50 flex items-end justify-between gap-1.5 min-w-0">
            <div className="min-w-0 flex-1 truncate">
              {deal.precoAntigo > deal.preco && (
                <span className="text-[10px] font-medium text-slate-400 line-through mb-0.5 block truncate">
                  {precoAntigoFormatado}
                </span>
              )}
              
              <div className="flex items-end gap-0.5 text-red-600">
                <span className="text-xs font-bold mb-0.5 leading-none">R$</span>
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none block">
                  {deal.preco?.toFixed(2).split('.')[0]}
                </span>
                <span className="text-xs font-bold mb-0.5 leading-none">
                  ,{deal.preco?.toFixed(2).split('.')[1]}
                </span>
              </div>
            </div>

            <a href={deal.urlAfiliado || linkDestino} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white p-2.5 sm:p-3 rounded-xl hover:bg-slate-800 transition active:scale-95 flex-shrink-0 shadow-sm shadow-slate-900/10">
              <ShoppingBag size={18} strokeWidth={2.5} />
            </a>
          </div>

          {/* RODAPÉ DO CARD (Comentários e Fav) - Estilo do Print */}
          <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <Link href={`${linkDestino}#comentarios`} className="flex items-center gap-1 hover:text-slate-600 transition">
              <MessageCircle size={12} strokeWidth={2.5} /> {deal.comentarios || 0} opiniões
            </Link>
            <div className="flex items-center gap-1">
              {deal.qtdSalvos || 0} <Heart size={12} strokeWidth={2.5} />
            </div>
          </div>

        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full transition-colors active:scale-95">
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="text-center mb-6 mt-2">
              <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-orange-500 border border-orange-100">
                <Heart size={36} className="fill-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Quase lá!</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Faça login rapidinho para salvar as melhores pechinchas no seu perfil e não perder mais nenhuma oferta.</p>
            </div>
            
            <button 
              onClick={handleLoginNoModal} 
              className="w-full bg-slate-900 text-white font-bold py-4.5 rounded-2xl hover:bg-slate-800 transition-colors mb-3 flex items-center justify-center gap-2.5 text-base active:scale-95 shadow-md shadow-slate-900/10"
            >
              <UserCircle size={22} /> Entrar com Google
            </button>
            
            <button onClick={() => setShowLoginModal(false)} className="w-full bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-colors active:scale-95 text-sm">
              Agora não, obrigado
            </button>
          </div>
        </div>
      )}
    </>
  );
}