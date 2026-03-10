"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

interface ProductActionsProps {
  dealId: string;
  dealTitulo: string;
  dealPrecoFormatado: string; // Nova propriedade para o WhatsApp
}

export default function ProductActions({ dealId, dealTitulo, dealPrecoFormatado }: ProductActionsProps) {
  const { user, signInWithGoogle } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verifica no Firebase se o utilizador já tem este item nos favoritos
  useEffect(() => {
    const checkFavoriteState = async () => {
      if (!user || !dealId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "usuarios", user.uid, "favoritos", dealId);
        const docSnap = await getDoc(docRef);
        setIsFavorite(docSnap.exists());
      } catch (error) {
        console.error("Erro ao verificar favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    checkFavoriteState();
  }, [user, dealId]);

  // Lógica do Coração (Adicionar/Remover do Firebase)
  const handleFavorite = async () => {
    if (!user) {
      return signInWithGoogle();
    }

    const novoEstado = !isFavorite;
    setIsFavorite(novoEstado);

    try {
      const docRef = doc(db, "usuarios", user.uid, "favoritos", dealId);
      
      if (novoEstado) {
        await setDoc(docRef, {
          salvoEm: new Date().getTime(),
          produtoId: dealId
        });
      } else {
        await deleteDoc(docRef);
      }
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      setIsFavorite(!novoEstado);
      alert("Ocorreu um erro ao salvar o favorito.");
    }
  };

  // Lógica de Partilha Direta para o WhatsApp (UI/UX de Excelência)
  const handleShare = () => {
    const urlAtual = window.location.href;
    
    // Formata a mensagem com asteriscos para ficar em negrito no WhatsApp
    const mensagem = `*Encontrei essa Promoção no Baratinho:*\n${dealTitulo} *${dealPrecoFormatado}*\n${urlAtual}`;
    
    // Codifica a mensagem para o formato de URL e chama a API oficial do WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    
    // Abre numa nova aba (aciona o WhatsApp Web no PC ou o App no celular)
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={handleFavorite}
        disabled={loading}
        className={`flex-1 border-2 font-bold py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 ${
          isFavorite 
            ? 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100' 
            : 'bg-white border-slate-100 text-slate-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        <Heart size={20} className={isFavorite ? 'fill-red-500' : ''} /> 
        {isFavorite ? 'Salvo' : 'Salvar'}
      </button>
      
      <button 
        onClick={handleShare}
        className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-[1.5rem] hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
      >
        {/* Ícone verde sutil no hover para remeter ao WhatsApp */}
        <Share2 size={20} /> Compartilhar
      </button>
    </div>
  );
}