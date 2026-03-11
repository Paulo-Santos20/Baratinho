"use client";

import React, { useState } from 'react';
import { Share2, Check, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 

export default function ShareButtons({ titulo, precoFormatado, urlProduto }: { titulo: string, precoFormatado: string, urlProduto: string }) {
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const { user } = useAuth();
  
  const link = urlProduto || (typeof window !== 'undefined' ? window.location.href : '');
  const textoCompartilhamento = `🚨 *Pechincha Encontrada!*\n\n${titulo}\n🔥 Por apenas: *${precoFormatado}*\n\nPegue aqui antes que acabe: ${link}`;

  // FUNÇÃO MÁGICA: Compartilhamento Nativo (Mobile-First)
  const handleCompartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Oferta no Baratinho',
          text: textoCompartilhamento,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado pelo usuário');
      }
    } else {
      // Se estiver no PC antigo e não tiver a gaveta de compartilhamento, copia o link direto
      navigator.clipboard.writeText(textoCompartilhamento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleSalvar = () => {
    if (!user) {
      alert('Faça login para salvar esta oferta no seu perfil!');
      return;
    }
    setSalvo(!salvo);
  };

  return (
    <div className="flex items-center gap-3 w-full mt-4">
      {/* BOTÃO SALVAR */}
      <button 
        onClick={handleSalvar}
        className={`flex-1 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 border ${
          salvo 
            ? 'bg-red-50 text-red-500 border-red-100 shadow-sm' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Heart size={20} className={salvo ? "fill-red-500" : ""} />
        {salvo ? 'Salvo' : 'Salvar'}
      </button>
      
      {/* BOTÃO COMPARTILHAR NATIVO */}
      <button 
        onClick={handleCompartilhar}
        className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {copiado ? <Check size={20} className="text-emerald-500" /> : <Share2 size={20} />}
        {copiado ? 'Copiado!' : 'Compartilhar'}
      </button>
    </div>
  );
}