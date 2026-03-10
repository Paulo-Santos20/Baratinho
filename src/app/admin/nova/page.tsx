"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Loader2, Save, Image as ImageIcon, Link as LinkIcon, Tag, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = "crossbrasil2018@gmail.com";

export default function NovaOfertaAdmin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  const [formData, setFormData] = useState({
    titulo: '', descricao: '', preco: '', precoAntigo: '', loja: '', imagemUrl: '', urlAfiliado: '', cupom: '', categoria: 'Geral'
  });

  // PROTEÇÃO DE ROTA (Arquitetura de Segurança)
  useEffect(() => {
    if (!loading) {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/'); // Expulsa intrusos para a página inicial
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.email !== ADMIN_EMAIL) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const extrairDadosDoLink = async () => {
    if (!urlInput) {
      setMensagem({ tipo: 'erro', texto: 'Cole um link primeiro!' });
      return;
    }

    setIsScraping(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });

      if (!response.ok) throw new Error('Falha ao varrer o link.');
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        titulo: data.titulo || prev.titulo,
        descricao: data.descricao || prev.descricao,
        imagemUrl: data.imagemUrl || prev.imagemUrl,
        loja: data.loja || prev.loja,
        urlAfiliado: data.urlOriginal || urlInput,
        preco: data.precoSugerido > 0 ? String(data.precoSugerido) : prev.preco
      }));

      setMensagem({ tipo: 'sucesso', texto: 'Dados extraídos! Confira os preços e adicione seu link de afiliado final.' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'A loja bloqueou a leitura automática. Preencha os campos manualmente.' });
    } finally {
      setIsScraping(false);
    }
  };

  const salvarOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const response = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erro ao salvar.');

      setMensagem({ tipo: 'sucesso', texto: '🚀 Oferta publicada com sucesso na página inicial!' });
      setFormData({ titulo: '', descricao: '', preco: '', precoAntigo: '', loja: '', imagemUrl: '', urlAfiliado: '', cupom: '', categoria: 'Geral' });
      setUrlInput('');
      
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao conectar com o banco de dados.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Barra de Navegação Exclusiva do Admin */}
      <div className="bg-slate-900 w-full py-4 px-6 mb-8 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-slate-300 hover:text-white flex items-center gap-2 font-medium transition-colors">
            <ArrowLeft size={20} /> Voltar para o Site
          </Link>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <ShieldCheck size={18} /> Acesso Admin Confirmado
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Card de Busca */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nova Oferta Manual</h1>
            <p className="text-slate-500 mt-1">Varra o link de uma loja (Amazon, Mercado Livre, etc) e publique rapidamente.</p>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="url" 
              placeholder="Cole o link do produto aqui..." 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none flex-grow md:w-80 transition-all font-medium"
            />
            <button 
              onClick={extrairDadosDoLink}
              disabled={isScraping}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScraping ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              {isScraping ? 'Buscando...' : 'Varrer Link'}
            </button>
          </div>
        </div>

        {mensagem.texto && (
          <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${mensagem.tipo === 'erro' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
            {mensagem.tipo === 'erro' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="font-medium">{mensagem.texto}</span>
          </div>
        )}

        {/* Formulário Principal */}
        <form onSubmit={salvarOferta} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título da Oferta *</label>
                <input required type="text" name="titulo" value={formData.titulo} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 text-emerald-600">Preço Atual *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-emerald-600 font-black">R$</span>
                    <input required type="number" step="0.01" name="preco" value={formData.preco} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Preço Antigo (Riscado)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-medium">R$</span>
                    <input type="number" step="0.01" name="precoAntigo" value={formData.precoAntigo} onChange={handleInputChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Link Final (Com seu Afiliado) *</label>
                <div className="flex relative">
                  <div className="absolute left-4 top-3 text-slate-400"><LinkIcon size={18} /></div>
                  <input required type="url" name="urlAfiliado" value={formData.urlAfiliado} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-600" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Loja</label>
                  <input type="text" name="loja" value={formData.loja} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cupom</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400"><Tag size={18} /></span>
                    <input type="text" name="cupom" value={formData.cupom} onChange={handleInputChange} placeholder="EX: ACHOU10" className="w-full pl-12 pr-4 py-3 bg-orange-50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none uppercase font-black text-orange-600 placeholder:font-medium placeholder:normal-case" />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">URL da Imagem</label>
                <div className="flex relative">
                  <div className="absolute left-4 top-3 text-slate-400"><ImageIcon size={18} /></div>
                  <input type="url" name="imagemUrl" value={formData.imagemUrl} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm text-slate-600" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 h-44 flex items-center justify-center overflow-hidden p-2">
                {formData.imagemUrl ? (
                  <img src={formData.imagemUrl} alt="Preview" className="h-full object-contain mix-blend-multiply rounded-xl" />
                ) : (
                  <span className="text-slate-400 font-medium text-sm flex flex-col items-center gap-2">
                    <ImageIcon size={32} className="opacity-40" />
                    A imagem aparecerá aqui
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição da Oferta</label>
                <textarea name="descricao" rows={3} value={formData.descricao} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none font-medium text-slate-600"></textarea>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-100 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 text-lg hover:-translate-y-0.5"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              {isSaving ? 'Publicando...' : 'Publicar no Site Agora'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}