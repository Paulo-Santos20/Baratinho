import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import { Search, Frown, Filter, LayoutGrid, List as ListIcon, Star, Clock, TrendingDown, ToggleLeft, ToggleRight } from 'lucide-react';

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; sort?: string; ocultar_encerradas?: string }>;
}) {
  const resolvedParams = await searchParams;
  const termoBusca = resolvedParams.q || '';
  const termoFormatado = termoBusca.toLowerCase().trim();
  
  const viewMode = resolvedParams.view || 'grid';
  const sortBy = resolvedParams.sort || 'recentes';
  const ocultarEncerradas = resolvedParams.ocultar_encerradas === 'true'; // Novo padrão

  const buildUrl = (updates: { view?: string; sort?: string; ocultar_encerradas?: string }) => {
    const params = new URLSearchParams();
    if (termoBusca) params.set('q', termoBusca);
    params.set('view', updates.view !== undefined ? updates.view : viewMode);
    params.set('sort', updates.sort !== undefined ? updates.sort : sortBy);
    params.set('ocultar_encerradas', updates.ocultar_encerradas !== undefined ? updates.ocultar_encerradas : String(ocultarEncerradas));
    return `?${params.toString()}`;
  };

  const qFirebase = query(collection(db, "ofertas"), limit(100));
  const snapshot = await getDocs(qFirebase);
  
  let todasOfertas = snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      dataCriacao: data.dataCriacao?.toMillis ? data.dataCriacao.toMillis() : Date.now()
    };
  }) as any[];

  // 1. Filtro de Texto
  let resultados = termoFormatado 
    ? todasOfertas.filter(oferta => 
        oferta.titulo?.toLowerCase().includes(termoFormatado) ||
        oferta.loja?.toLowerCase().includes(termoFormatado)
      )
    : todasOfertas;

  // 2. Filtro: Ocultar Encerradas
  if (ocultarEncerradas) {
    // Se a oferta tiver ativa === false, ela é removida do array de resultados
    resultados = resultados.filter(oferta => oferta.ativa !== false);
  }

  // 3. Ordenação
  resultados.sort((a, b) => {
    if (sortBy === 'menor_preco') return a.preco - b.preco;
    if (sortBy === 'destaques') return (b.hot ? 1 : 0) - (a.hot ? 1 : 0);
    return b.dataCriacao - a.dataCriacao;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR DE FILTROS */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm sticky top-28">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Filter size={20} className="text-orange-500" strokeWidth={2.5} />
              <h2 className="font-black text-lg text-slate-800 tracking-tight">Filtros</h2>
            </div>

            {/* Visualização */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-400 mb-3 text-xs uppercase tracking-widest">Visualização</h3>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <Link href={buildUrl({ view: 'grid' })} scroll={false} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-500 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                  <LayoutGrid size={18} /> Grade
                </Link>
                <Link href={buildUrl({ view: 'list' })} scroll={false} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-500 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ListIcon size={18} /> Coluna
                </Link>
              </div>
            </div>

            {/* Ocultar Encerradas */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-400 mb-3 text-xs uppercase tracking-widest">Disponibilidade</h3>
              <Link href={buildUrl({ ocultar_encerradas: ocultarEncerradas ? 'false' : 'true' })} scroll={false} className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all">
                {/* Alteração na Label */}
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">Ocultar encerradas</span>
                {ocultarEncerradas ? <ToggleRight size={28} className="text-orange-500" /> : <ToggleLeft size={28} className="text-slate-300" />}
              </Link>
            </div>
          </div>
        </aside>

        {/* RESULTADOS */}
        <div className="flex-1">
          <header className="mb-8">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {resultados.length > 0 ? "Resultados para" : "Buscando por"} <span className="text-orange-500">"{termoBusca || 'Tudo'}"</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Exibindo {resultados.length} oferta{resultados.length !== 1 && 's'}.
              </p>
            </div>
            
            {resultados.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <Link href={buildUrl({ sort: 'destaques' })} scroll={false} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${sortBy === 'destaques' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}>
                  <Star size={16} className={sortBy === 'destaques' ? "fill-white" : ""} /> Destaques
                </Link>
                
                <Link href={buildUrl({ sort: 'recentes' })} scroll={false} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${sortBy === 'recentes' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}>
                  <Clock size={16} /> Recentes
                </Link>

                <Link href={buildUrl({ sort: 'menor_preco' })} scroll={false} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${sortBy === 'menor_preco' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}>
                  <TrendingDown size={16} /> Menor Preço
                </Link>
              </div>
            )}
          </header>

          {resultados.length > 0 ? (
            /* A MÁGICA DA COLUNA ACONTECE AQUI:
               Se o usuário clicou em 'list' (coluna), o Grid vira grid-cols-1,
               fazendo o card ocupar 100% da largura e esticar horizontalmente.
            */
            <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {resultados.map((deal) => (
                <DealCard key={deal.id} deal={deal} viewMode={viewMode as 'grid' | 'list'} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm px-4">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Search size={48} className="text-slate-300" strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Poxa, não achamos nada!</h2>
              <p className="text-slate-500 max-w-md">
                Tente ajustar os filtros ou usar palavras mais genéricas.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}