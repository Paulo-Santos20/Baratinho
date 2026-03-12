"use client";

import React, { useState, useEffect } from 'react';
import { Share2, Check, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; 
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function ShareButtons({ 
  dealId, 
  titulo, 
  precoFormatado, 
  urlProduto, 
  initialLikes = [] 
}: { 
  dealId: string, 
  titulo: string, 
  precoFormatado: string, 
  urlProduto: string, 
  initialLikes?: string[] 
}) {
  const [copiado, setCopiado] = useState(false);
  const { user } = useAuth();
  
  // Verifica se o usuário atual já havia salvo a oferta
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (user && initialLikes) {
      setSalvo(initialLikes.includes(user.uid));
    } else {
      setSalvo(false);
    }
  }, [user, initialLikes]);
  
  const link = urlProduto || (typeof window !== 'undefined' ? window.location.href : '');
  const textoCompartilhamento = `🚨 *Pechincha Encontrada!*\n\n${titulo}\n🔥 Por apenas: *${precoFormatado}*\n\nPegue aqui antes que acabe: ${link}`;

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
      navigator.clipboard.writeText(textoCompartilhamento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  // GRAVAÇÃO DO FAVORITO NO FIREBASE PELA PÁGINA DO PRODUTO
  const handleSalvar = async () => {
    if (!user) {
      alert('Faça login para salvar esta oferta no seu perfil!');
      return;
    }

    const estadoAnterior = salvo;
    setSalvo(!salvo); // Optimistic UI

    try {
      const dealRef = doc(db, 'ofertas', dealId);
      
      if (estadoAnterior) {
        await updateDoc(dealRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(dealRef, { likes: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error);
      setSalvo(estadoAnterior); // Desfaz em caso de erro
    }
  };

  return (
    <div className="flex items-center gap-3 w-full mt-4">
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