import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import CommentBox from '@/components/CommentBox'; // IMPORTAÇÃO DA NOSSA CAIXA DE COMENTÁRIOS
import { ChevronRight, ShoppingBag, Heart, Share2, TrendingDown, ShieldCheck, AlertCircle, MessageCircle, Star } from 'lucide-react';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const qFirebase = query(collection(db, "ofertas"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(qFirebase);

  if (snapshot.empty) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 pb-20 text-center px-4">
          <AlertCircle size={64} className="text-slate-300 mb-6" strokeWidth={1.5} />
          <h1 className="text-3xl font-black text-slate-800 mb-2">Pechincha não encontrada!</h1>
          <p className="text-slate-500 mb-8">Essa oferta pode ter expirado ou o link está incorreto.</p>
          <Link href="/" className="bg-orange-500 text-white font-bold py-4 px-8 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200">
            Voltar para o Início
          </Link>
        </div>
      </div>
    );
  }

  const deal = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;

  const preco = deal.preco || 0;
  const precoAntigo = deal.precoAntigo || 0;
  const temDesconto = precoAntigo > preco;
  const valorEconomia = precoAntigo - preco;
  const porcentagemDesconto = temDesconto ? Math.round((valorEconomia / precoAntigo) * 100) : 0;

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const historicoPrecos = [
    { mes: 'Nov', valor: preco * 1.3, atual: false },
    { mes: 'Dez', valor: preco * 1.1, atual: false },
    { mes: 'Jan', valor: preco * 1.2, atual: false },
    { mes: 'Fev', valor: preco * 1.05, atual: false },
    { mes: 'Hoje', valor: preco, atual: true },
  ];
  const maiorPrecoHistorico = Math.max(...historicoPrecos.map(h => h.valor));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12">
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href={`/busca?q=${deal.categoria || 'Tecnologia'}`} className="hover:text-orange-500 transition-colors">
            {deal.categoria || 'Tecnologia'}
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 truncate max-w-[200px] md:max-w-md">{deal.titulo}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">
          <div className="flex-1 min-w-0">
            
            <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
              <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-visible">
                {[1, 2, 3].map((item) => (
                  <div key={item} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex-shrink-0 flex items-center justify-center p-2 cursor-pointer transition-all ${item === 1 ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50 hover:border-orange-200'}`}>
                    <img src={deal.imagemUrl || "https://placehold.co/400x400"} alt="Miniatura" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-slate-50 rounded-[2rem] aspect-square md:aspect-auto md:h-[500px] flex items-center justify-center p-8 order-1 md:order-2 relative group overflow-hidden border border-slate-100/50">
                <img src={deal.imagemUrl || "https://placehold.co/800x800"} alt={deal.titulo} className="max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                {temDesconto && (
                  <div className="absolute top-6 right-6 bg-red-500 text-white font-black px-4 py-2 rounded-xl text-sm shadow-lg shadow-red-200 flex items-center gap-1">
                    <TrendingDown size={18} /> -{porcentagemDesconto}%
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm mb-8">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <TrendingDown size={24} className="text-orange-500" />
                <h2 className="text-xl font-black text-slate-800">Histórico de Preços</h2>
              </div>
              <div className="flex items-end justify-between gap-2 h-40 mt-6 px-2">
                {historicoPrecos.map((item, index) => {
                  const alturaBarra = (item.valor / maiorPrecoHistorico) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 group">
                      <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatarMoeda(item.valor)}
                      </span>
                      <div className={`w-full max-w-[3rem] rounded-t-lg transition-all duration-500 ${item.atual ? 'bg-orange-500 shadow-lg shadow-orange-200' : 'bg-slate-100 group-hover:bg-slate-200'}`} style={{ height: `${alturaBarra}%` }}></div>
                      <span className={`text-xs font-bold mt-3 ${item.atual ? 'text-orange-500' : 'text-slate-400'}`}>{item.mes}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO DE COMENTÁRIOS VIVA! */}
            <div id="comentarios" className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                <MessageCircle size={24} className="text-orange-500" />
                <h2 className="text-xl font-black text-slate-800">Comentários da Comunidade</h2>
              </div>
              
              <CommentBox dealId={deal.id} />
              
            </div>

          </div>

          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-orange-100 text-orange-600 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg">{deal.loja || "Loja Parceira"}</span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-slate-700">4.9</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-6">{deal.titulo}</h1>
              <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
                {temDesconto && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 line-through font-medium">{formatarMoeda(precoAntigo)}</span>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">Economia de {formatarMoeda(valorEconomia)}</span>
                  </div>
                )}
                <div className="text-5xl font-black text-slate-900 tracking-tighter">{formatarMoeda(preco)}</div>
                <p className="text-sm text-slate-500 font-medium mt-2">Vendido e entregue por <strong className="text-slate-700">{deal.loja || "Loja Oficial"}</strong></p>
              </div>

              <div className="space-y-3 mb-6">
                <a href={deal.urlAfiliado || '#'} target="_blank" rel="noopener noreferrer" className="w-full bg-orange-500 text-white font-black text-lg py-5 rounded-[1.5rem] hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-3 active:scale-[0.98]">
                  <ShoppingBag size={24} /> Pegar Pechincha
                </a>
                <div className="flex gap-3">
                  <button className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-[1.5rem] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                    <Heart size={20} /> Salvar
                  </button>
                  <button className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-[1.5rem] hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    <Share2 size={20} /> Compartilhar
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-100 text-green-700">
                <ShieldCheck size={24} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium"><strong>Compra Segura:</strong> O Baratinho verifica todos os links.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}