import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import CommentBox from '@/components/CommentBox';
import ProductActions from '@/components/ProductActions';
import DealCard from '@/components/DealCard'; 
import CouponCopy from '@/components/CouponCopy';
import { ChevronRight, ShoppingBag, TrendingDown, AlertCircle, MessageCircle, Star, Info, Tag, Truck, ShieldCheck, FileText } from 'lucide-react';

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

  const qRelacionados = query(collection(db, "ofertas"), where("categoria", "==", deal.categoria || 'Tecnologia'), limit(5));
  const snapRelacionados = await getDocs(qRelacionados);
  const produtosRelacionados = snapRelacionados.docs
    .map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        dataCriacao: data.dataCriacao?.toMillis ? data.dataCriacao.toMillis() : Date.now()
      };
    })
    .filter(d => d.id !== deal.id)
    .slice(0, 4);

  const preco = deal.preco || 0;
  const precoAntigo = deal.precoAntigo || 0;
  const temDesconto = precoAntigo > preco;
  const valorEconomia = precoAntigo - preco;
  const porcentagemDesconto = temDesconto ? Math.round((valorEconomia / precoAntigo) * 100) : 0;

  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  const precoFormatadoCompleto = formatarMoeda(preco);

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
          <Link href={`/busca?q=${deal.loja || 'Ofertas'}`} className="hover:text-orange-500 transition-colors">
            {deal.loja || 'Loja Parceira'}
          </Link>
          <ChevronRight size={14} />
          <span className="text-slate-600 truncate max-w-[200px] md:max-w-md">{deal.titulo}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Bloco 1: Produto Principal */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="bg-orange-100 text-orange-600 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg">
                  {deal.loja || "Loja Parceira"}
                </span>
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg">
                  <Star size={14} className="fill-amber-500" />
                  <span className="text-sm font-bold">Oferta Quente</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-full md:w-1/2 bg-slate-50 rounded-[2rem] aspect-square flex items-center justify-center p-6 relative group border border-slate-100/50">
                  <img src={deal.imagemUrl || "https://placehold.co/800x800"} alt={deal.titulo} className="max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                  {temDesconto && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white font-black px-3 py-1.5 rounded-xl text-xs shadow-md shadow-red-200 flex items-center gap-1">
                      <TrendingDown size={14} /> -{porcentagemDesconto}%
                    </div>
                  )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-snug mb-4">
                    {deal.titulo}
                  </h1>
                  
                  <div className="mb-6">
                    {temDesconto && (
                      <span className="text-slate-400 line-through font-medium text-sm block mb-1">
                        {formatarMoeda(precoAntigo)}
                      </span>
                    )}
                    <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                      {precoFormatadoCompleto}
                    </div>
                  </div>

                  {deal.cupom && (
                    <CouponCopy cupom={deal.cupom} />
                  )}

                  <div className="space-y-3 mt-auto">
                    <a href={deal.urlAfiliado || '#'} target="_blank" rel="noopener noreferrer" className="w-full bg-orange-500 text-white font-black text-lg py-4 rounded-[1.5rem] hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98]">
                      <ShoppingBag size={20} /> Pegar Promoção
                    </a>
                    
                    <ProductActions dealId={deal.id} dealTitulo={deal.titulo} dealPrecoFormatado={precoFormatadoCompleto} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: A Mágica da Descrição do Produto aparece aqui! */}
            {deal.descricao && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <FileText size={22} className="text-orange-500" strokeWidth={2.5} />
                  <h2 className="text-lg font-black text-slate-800">Sobre o Produto</h2>
                </div>
                
                {/* Usamos o dangerouslySetInnerHTML para renderizar o HTML da API.
                  As classes do Tailwind abaixo estilizam as tags internas do HTML (p, ul, li, strong) 
                  garantindo que não quebre o nosso design system.
                */}
                <div 
                  className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul>li]:mb-2 [&>strong]:text-slate-800"
                  dangerouslySetInnerHTML={{ __html: deal.descricao }}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col h-[600px] lg:h-auto overflow-hidden">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 flex-shrink-0">
              <MessageCircle size={22} className="text-orange-500" strokeWidth={2.5} />
              <h2 className="text-lg font-black text-slate-800">Interaja com a Comunidade</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <CommentBox dealId={deal.id} />
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <TrendingDown size={22} className="text-orange-500" />
                <h2 className="text-lg font-black text-slate-800">Menor preço dos últimos 90 dias!</h2>
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-2 h-32 mt-6 px-2">
              {historicoPrecos.map((item, index) => {
                const alturaBarra = (item.valor / maiorPrecoHistorico) * 100;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatarMoeda(item.valor)}
                    </span>
                    <div className={`w-full max-w-[2.5rem] rounded-t-lg transition-all duration-500 ${item.atual ? 'bg-gradient-to-t from-orange-400 to-orange-500 shadow-lg shadow-orange-200' : 'bg-slate-100 group-hover:bg-slate-200'}`} style={{ height: `${alturaBarra}%` }}></div>
                    <span className={`text-[10px] md:text-xs font-bold mt-2 ${item.atual ? 'text-orange-500' : 'text-slate-400'}`}>{item.mes}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Info size={22} className="text-orange-500" />
              <h2 className="text-lg font-black text-slate-800">Detalhes da Oferta</h2>
            </div>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0"><Tag size={16} className="text-slate-400" /></div>
                <span className="text-sm font-medium">Cupom aplicável na finalização da compra.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0"><Truck size={16} className="text-slate-400" /></div>
                <span className="text-sm font-medium">Verifique o frete para a sua região. Pode haver frete grátis.</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0"><ShieldCheck size={16} className="text-slate-400" /></div>
                <span className="text-sm font-medium">Promoção Verificada pela nossa equipe. Loja 100% segura.</span>
              </li>
            </ul>
          </div>
        </div>

        {produtosRelacionados.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-black text-slate-800">Você também pode gostar</h2>
              <span className="text-2xl font-black text-orange-500">...</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {produtosRelacionados.map((relacionado) => (
                <DealCard key={relacionado.id} deal={relacionado} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}