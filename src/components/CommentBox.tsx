"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, CheckCircle2, MessageSquareOff } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Tipagem de Arquitetura Escalável para garantir que os dados estejam perfeitos
interface Comentario {
  id: string;
  texto: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioFoto: string;
  dataCriacao: number;
}

export default function CommentBox({ dealId }: { dealId: string }) {
  const { user, signInWithGoogle } = useAuth();
  
  const [comentario, setComentario] = useState("");
  const [comentariosLista, setComentariosLista] = useState<Comentario[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

  // Efeito de Performance Total: Busca os comentários em tempo real do Firebase
  useEffect(() => {
    if (!dealId) return;

    // Caminho da Subcoleção: ofertas -> [id_da_oferta] -> comentarios
    const q = query(
      collection(db, "ofertas", dealId, "comentarios"),
      orderBy("dataCriacao", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comentariosFirebase = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          texto: data.texto,
          usuarioId: data.usuarioId,
          usuarioNome: data.usuarioNome,
          usuarioFoto: data.usuarioFoto,
          // Lida com o tempo real do Firebase (evita null enquanto sincroniza)
          dataCriacao: data.dataCriacao?.toMillis ? data.dataCriacao.toMillis() : Date.now()
        } as Comentario;
      });
      setComentariosLista(comentariosFirebase);
    });

    return () => unsubscribe(); // Limpa o listener ao sair da página
  }, [dealId]);

  const handlePublicar = async () => {
    if (!user) {
      return signInWithGoogle();
    }

    if (comentario.trim().length === 0) return;

    setIsSubmitting(true);

    try {
      // Salva de forma estruturada no banco de dados
      await addDoc(collection(db, "ofertas", dealId, "comentarios"), {
        texto: comentario.trim(),
        usuarioId: user.uid,
        usuarioNome: user.displayName || "Usuário",
        usuarioFoto: user.photoURL || "",
        dataCriacao: serverTimestamp() // Usa o relógio oficial do servidor do Google
      });

      // Feedback de UI/UX de Excelência
      setComentario("");
      setMensagemSucesso(true);
      
      // Esconde a mensagem de sucesso após 4 segundos
      setTimeout(() => setMensagemSucesso(false), 4000);

    } catch (error) {
      console.error("Erro ao salvar comentário:", error);
      alert("Ocorreu um erro ao publicar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatador de data elegante
  const formatarData = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* ======================================================= */}
      {/* 1. ÁREA DE PUBLICAÇÃO DO COMENTÁRIO                       */}
      {/* ======================================================= */}
      <div>
        {/* MENSAGEM DE SUCESSO (Aparece em cima da caixa) */}
        {mensagemSucesso && (
          <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-2xl border border-green-100 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <CheckCircle2 size={24} className="flex-shrink-0" />
            <span className="font-bold">Seu comentário foi publicado com sucesso!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "Perfil"} 
              referrerPolicy="no-referrer" 
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
              disabled={isSubmitting}
              placeholder={user ? `E aí, ${user.displayName?.split(' ')[0]}, o que achou dessa pechincha?` : "Faça login para deixar sua opinião sobre essa oferta."}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:bg-white focus:border-orange-500 transition-all resize-none min-h-[100px] text-slate-700 font-medium disabled:opacity-60"
            />
            <div className="flex justify-end mt-3">
              {user ? (
                <button 
                  onClick={handlePublicar} 
                  disabled={isSubmitting || comentario.trim().length === 0}
                  className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? "Publicando..." : "Publicar Comentário"}
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
      </div>

      {/* ======================================================= */}
      {/* 2. LISTAGEM DOS COMENTÁRIOS SALVOS                        */}
      {/* ======================================================= */}
      <div className="space-y-6 pt-4 border-t border-slate-100">
        {comentariosLista.length > 0 ? (
          comentariosLista.map((cmt) => (
            <div key={cmt.id} className="flex gap-4 group">
              <img 
                src={cmt.usuarioFoto || "https://placehold.co/100x100"} 
                alt={cmt.usuarioNome} 
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-slate-200 flex-shrink-0 mt-1"
              />
              <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:border-slate-200 transition-colors">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="font-bold text-slate-800 text-sm">{cmt.usuarioNome}</span>
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                    {formatarData(cmt.dataCriacao)}
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {cmt.texto}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
            <MessageSquareOff size={40} strokeWidth={1.5} className="mb-3 text-slate-300" />
            <p className="font-medium text-sm">Seja o primeiro a avaliar esta oferta!</p>
          </div>
        )}
      </div>

    </div>
  );
}