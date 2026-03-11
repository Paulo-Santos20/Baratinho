"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = "crossbrasil2018@gmail.com";

export default function GerenciarOfertasAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Proteção de Rota
  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Busca as ofertas ao carregar a página
  const carregarOfertas = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/ofertas');
      const data = await res.json();
      setOfertas(data);
    } catch (error) {
      console.error("Erro ao carregar", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      carregarOfertas();
    }
  }, [user]);

  // Função para apagar oferta
  const handleApagar = async (id: string, titulo: string) => {
    if (window.confirm(`Tem certeza que deseja apagar a oferta:\n"${titulo}"?`)) {
      try {
        const res = await fetch(`/api/ofertas?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          // Remove da tela instantaneamente (Performance Total)
          setOfertas(ofertas.filter(oferta => oferta.id !== id));
        }
      } catch (error) {
        alert("Erro ao apagar a oferta.");
      }
    }
  };

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Barra Admin */}
      <div className="bg-slate-900 w-full py-4 px-6 mb-8 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/admin/nova" className="text-slate-300 hover:text-white flex items-center gap-2 font-medium transition-colors">
            <ArrowLeft size={20} /> Voltar para Criação
          </Link>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <ShieldCheck size={18} /> Admin: Modo Gerenciamento
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gerenciar Ofertas</h1>
            <p className="text-slate-500 mt-1">Veja, gerencie e apague produtos do banco de dados.</p>
          </div>
          <span className="bg-orange-100 text-orange-700 font-bold px-4 py-2 rounded-xl border border-orange-200">
            Total: {ofertas.length} Ofertas Ativas
          </span>
        </div>

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoadingData ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-medium">Carregando banco de dados...</p>
            </div>
          ) : ofertas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">Nenhuma oferta encontrada no sistema.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-sm uppercase tracking-wider">
                    <th className="p-4">Produto</th>
                    <th className="p-4">Loja</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ofertas.map((oferta) => (
                    <tr key={oferta.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-4 min-w-[300px]">
                        <img src={oferta.imagemUrl} alt="Produto" className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white" />
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-2 text-sm">{oferta.titulo}</p>
                          <a href={oferta.urlAfiliado} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 mt-1">
                            Ver Link Original <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-600 whitespace-nowrap">
                        {oferta.loja}
                      </td>
                      <td className="p-4 text-sm font-black text-slate-900 whitespace-nowrap">
                        R$ {oferta.preco.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => handleApagar(oferta.id, oferta.titulo)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Apagar Oferta"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}