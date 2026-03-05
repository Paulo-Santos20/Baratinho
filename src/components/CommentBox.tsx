"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle } from 'lucide-react';

export default function CommentBox({ dealId }: { dealId: string }) {
  const { user, signInWithGoogle } = useAuth();
  const [comentario, setComentario] = useState("");

  const handlePublicar = () => {
    if (!user) return signInWithGoogle();
    alert("O seu comentário será salvo no Firebase no próximo passo!");
    setComentario("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* A MÁGICA DA FOTO DO GOOGLE */}
      {user?.photoURL ? (
        <img 
          src={user.photoURL} 
          alt={user.displayName || "Perfil"} 
          referrerPolicy="no-referrer" // Essencial para evitar bloqueios de imagem do Google
          className="w-12 h-12 rounded-full border-2 border-orange-100 shadow-sm object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 text-slate-400">
          <UserCircle size={28} strokeWidth={2} />
        </div>
      )}
      
      <div className="flex-1">
        <textarea 
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          // UX de Excelência: Chama o usuário pelo primeiro nome
          placeholder={user ? `E aí, ${user.displayName?.split(' ')[0]}, o que achou dessa pechincha?` : "Faça login para deixar sua opinião sobre essa oferta."}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:bg-white focus:border-orange-500 transition-all resize-none min-h-[100px] text-slate-700 font-medium"
        />
        <div className="flex justify-end mt-3">
          {user ? (
            <button 
              onClick={handlePublicar} 
              className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              Publicar Comentário
            </button>
          ) : (
            <button 
              onClick={signInWithGoogle} 
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              Entrar com Google para Comentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}