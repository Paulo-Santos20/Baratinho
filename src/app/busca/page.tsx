import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import DealCard from '@/components/DealCard';
import Navbar from '@/components/Navbar';
import { Search, Filter, LayoutGrid, List as ListIcon, Star, Clock, TrendingDown, ToggleLeft, ToggleRight, HeartCrack, Sparkles } from 'lucide-react';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const termo = resolvedParams.q ? `Resultados para "${resolvedParams.q}"` : 'Busca de Ofertas';
  
  return {
    title: `${termo} | Baratinho`,
    description: 'Encontre as melhores pechinchas, cupons e descontos das maiores lojas do Brasil em tempo real no Baratinho.',
  };
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; sort?: string; ocultar_encerradas?: string }>;
}) {
  const resolvedParams = await searchParams;
  const termoBusca = resolvedParams.q || '';
  const termosFormatados = termoBusca.toLowerCase().trim().split(' ').filter(t => t.length > 0);
  
  const viewMode = resolvedParams.view || 'grid';
  
  const defaultSort = termoBusca ? 'relevancia' : 'recentes';
  const sortBy = resolvedParams.sort || defaultSort;
  
  const ocultarEncerradas = resolvedParams.ocultar_encerradas !== 'false';

  const buildUrl = (updates: { view?: string; sort?: string; ocultar_encerradas?: string }) => {
    const params = new URLSearchParams();
    if (termoBusca) params.set('q', termoBusca);
    params.set('view', updates.view !== undefined ? updates.view : viewMode);
    params.set('sort', updates.sort !== undefined ? updates.sort : sortBy);
    params.set('ocultar_encerradas', updates.ocultar_encerradas !== undefined ? updates.ocultar_encerradas : String(ocultarEncerradas));
    return `/busca?${params.toString()}`;
  };

  const qFirebase = query(collection(db, "ofertas"), orderBy("dataCriacao", "desc"), limit(200));
  const snapshot = await getDocs(qFirebase);
  
  let todasOfertas = snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      dataCriacao: data.dataCriacao?.toMillis ? data.dataCriacao.toMillis() : Date.now()
    };
  }) as any[];

  let resultados = termosFormatados.length > 0
    ? todasOfertas.filter(oferta => {
        const tituloLower = (oferta.titulo || '').toLowerCase();
        const lojaLower = (oferta.loja || '').toLowerCase();
        const textoCompleto = `${tituloLower} ${lojaLower}`;
        return termosFormatados.every(termo => textoCompleto.includes(termo));
      })
    : todasOfertas;

  if (ocultarEncerradas) {
    resultados = resultados.filter(oferta => oferta.ativa !== false);
  }

  const calcularRelevancia = (oferta: any, termos: string[]) => {
    let score = 0;
    const tituloLower = (oferta.titulo || '').toLowerCase();
    const categoriaLower = (oferta.categoria || '').toLowerCase();

    termos.forEach(termo => {
      if (categoriaLower === termo || categoriaLower.includes(termo)) {
        score += 50;
      }
      
      const regexPalavraExata = new RegExp(`\\b${termo}\\b`, 'i');
      if (regexPalavraExata.test(tituloLower)) {
        score += 30;
      } 
      else if (tituloLower.includes(termo)) {
        score += 10;
      }
    });

    if (oferta.hot) score += 5;
    score += (oferta.comentarios || 0) * 2;

    return score;
  };

  resultados.sort((a, b) => {
    if (sortBy === 'relevancia') {
      const relA = calcularRelevancia(a, termosFormatados);
      const relB = calcularRelevancia(b, termosFormatados);
      if (relA !== relB) return relB - relA; 
      return b.dataCriacao - a.dataCriacao; 
    }
    if (sortBy === 'menor_preco') return a.preco - b.preco;
    if (sortBy === 'destaques') {
      const scoreA = (a.precoAntigo > a.preco ? ((a.precoAntigo - a.preco) / a.precoAntigo) : 0) + (a.comentarios || 0);
      const scoreB = (b.precoAntigo > b.preco ? ((b.precoAntigo - b.preco) / b.precoAntigo) : 0) + (b.comentarios || 0);
      return scoreB - scoreA;
    }
    return b.dataCriacao - a.dataCriacao; 
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12 flex flex-col md:flex-row gap-8">
        
        <aside className="w-full md:w-72 flex-shrink-0">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-28">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
              <Filter size={24} className="text-orange-500" strokeWidth={2.5} />
              <h2 className="font-black text-xl text-slate-800 tracking-tight">Filtros da Busca</h2>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest">Estilo de Visualização</h3>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <Link href={buildUrl({ view: 'grid' })} scroll={false} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange-500 border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                  <LayoutGrid size={18} /> Grade
                </Link>
                <Link href={buildUrl({ view: 'list' })} scroll={false} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-500 border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>
                  <ListIcon size={18} /> Lista
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-400 mb-4 text-xs uppercase tracking-widest">Disponibilidade</h3>
              <Link href={buildUrl({ ocultar_encerradas: ocultarEncerradas ? 'false' : 'true' })} scroll={false} className="flex items-center justify-between cursor-pointer group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all shadow-sm">
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Ocultar Encerradas</span>
                {ocultarEncerradas ? <ToggleRight size={32} className="text-orange-500 transition-colors" /> : <ToggleLeft size={32} className="text-slate-300 transition-colors" />}
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="mb-10">
            <div className="mb-6">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                {resultados.length > 0 ? "Resultados para" : "Buscando por"} <span className="text-orange-500">"{termoBusca || 'Tudo'}"</span>
              </h1>
              <p className="text-slate-500 font-medium mt-3 flex items-center gap-2">
                Exibindo <strong className="text-slate-800">{resultados.length}</strong> oferta{resultados.length !== 1 && 's'} encontradas.
              </p>
            </div>
            
            {resultados.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm inline-flex">
                
                {termoBusca && (
                  <Link href={buildUrl({ sort: 'relevancia' })} scroll={false} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${sortBy === 'relevancia' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <Sparkles size={18} className={sortBy === 'relevancia' ? "fill-current" : ""} /> Relevância
                  </Link>
                )}

                <Link href={buildUrl({ sort: 'destaques' })} scroll={false} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${sortBy === 'destaques' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Star size={18} className={sortBy === 'destaques' ? "fill-current" : ""} /> Destaques
                </Link>
                
                <Link href={buildUrl({ sort: 'recentes' })} scroll={false} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${sortBy === 'recentes' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Clock size={18} /> Recentes
                </Link>

                <Link href={buildUrl({ sort: 'menor_preco' })} scroll={false} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${sortBy === 'menor_preco' ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <TrendingDown size={18} /> Menor Preço
                </Link>
              </div>
            )}
          </header>

          {resultados.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
              {resultados.map((deal) => (
                // AQUI ESTAVA O ERRO! Removi o viewMode, agora ele usa o DealCard padrão, 
                // e o CSS do grid logo acima faz o trabalho de esticar o card automaticamente.
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm px-6">
              <div className="bg-slate-50 p-8 rounded-full mb-8 border border-slate-100">
                <HeartCrack size={56} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Poxa, não achamos nada!</h2>
              <p className="text-slate-500 font-medium max-w-md text-lg leading-relaxed mb-8">
                Não encontramos nenhuma oferta ativa para "{termoBusca}". Tente ajustar os filtros ou usar palavras mais curtas.
              </p>
              <Link href="/" className="bg-orange-500 text-white font-black py-4 px-10 rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95">
                Voltar para a Home
              </Link>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}