import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import CommentBox from '@/components/CommentBox';
import DealCard from '@/components/DealCard'; 
import CouponCopy from '@/components/CouponCopy';
import ShareButtons from '@/components/ShareButtons';
import PriceChart from '@/components/PriceChart'; 
import { ChevronRight, ShoppingBag, TrendingDown, AlertCircle, MessageCircle, Star, Info, Tag, Truck, ShieldCheck, FileText, Clock } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const qFirebase = query(collection(db, "ofertas"), where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(qFirebase);

  if (snapshot.empty) {
    return {
      title: 'Oferta não encontrada | Baratinho',
      description: 'A pechincha que você procurava expirou ou não existe mais.',
    };
  }

  const deal = snapshot.docs[0].data();
  const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.preco || 0);
  
  const tituloOG = `🚨 ${precoFormatado} - ${deal.titulo}`;
  const descricaoLimpa = deal.descricao 
    ? deal.descricao.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 160) + '...' 
    : `Confira essa super oferta no Baratinho por apenas ${precoFormatado}! Corra antes que acabe.`;

  return {
    title: `${deal.titulo} por ${precoFormatado} | Baratinho`,
    description: descricaoLimpa,
    openGraph: {
      title: tituloOG,
      description: descricaoLimpa,
      url: `https://baratinho.vercel.app/p/${slug}`, 
      siteName: 'Baratinho',
      images: [
        {
          url: deal.imagemUrl || 'https://placehold.co/800x800/f8fafc/f97316?text=Baratinho',
          width: 800,
          height: 800,
          alt: deal.titulo,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tituloOG,
      description: descricaoLimpa,
      images: [deal.imagemUrl || 'https://placehold.co/800x800/f8fafc/f97316?text=Baratinho'],
    },
  };
}

const formatTimeAgo = (dateInput: any) => {
  if (!dateInput) return '';
  let date;
  if (typeof dateInput.toMillis === 'function') {
    date = new Date(dateInput.toMillis());
  } else if (dateInput._seconds) {
    date = new Date(dateInput._seconds * 1000);
  } else {
    date = new Date(dateInput);
  }
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Agora mesmo';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} h`;
  if (diffInHours < 48) return `Ontem`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Há ${diffInDays} dias`;
};

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
  const tempoAtras = formatTimeAgo(deal.dataCriacao);

  const dataGrafico = [
    { mes: 'Nov', valor: preco * 1.3, isAtual: false },
    { mes: 'Dez', valor: preco * 1.1, isAtual: false },
    { mes: 'Jan', valor: preco * 1.2, isAtual: false },
    { mes: 'Fev', valor: preco * 1.05, isAtual: false },
    { mes: 'Hoje', valor: preco, isAtual: true },
  ];

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

        {/* =========================================
            BLOCO SUPERIOR: PRODUTO + COMENTÁRIOS
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-orange-100 text-orange-600 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    {deal.loja || "Loja Parceira"}
                  </span>
                  {tempoAtras && (
                    <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock size={16} strokeWidth={2.5} /> {tempoAtras}
                    </span>
                  )}
                </div>
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
                      <span className="text-slate-400 line-through font-bold text-base md:text-lg block mb-1">
                        {formatarMoeda(precoAntigo)}
                      </span>
                    )}
                    <div className="text-5xl md:text-6xl font-black text-red-600 tracking-tighter leading-none">
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
                    
                    {/* Botões unificados de Compartilhar/Salvar */}
                    <ShareButtons titulo={deal.titulo} precoFormatado={precoFormatadoCompleto} urlProduto={`https://baratinho.vercel.app/p/${deal.slug}`} />
                  </div>
                </div>
              </div>
            </div>

            {deal.descricao && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <FileText size={22} className="text-orange-500" strokeWidth={2.5} />
                  <h2 className="text-lg font-black text-slate-800">Sobre o Produto</h2>
                </div>
                
                <div 
                  className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-6 [&>ul>li]:mb-2 [&>strong]:text-slate-800 break-words"
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

        {/* =========================================
            BLOCO INFERIOR: GRÁFICO + DETALHES
            ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4 flex-shrink-0">
              <TrendingDown size={22} className="text-orange-500" />
              <h2 className="text-lg font-black text-slate-800">Histórico de Preços (90 dias)</h2>
            </div>
            
            <div className="flex-1 min-h-[250px] w-full mt-4">
              <PriceChart dataGrafico={dataGrafico} />
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

        {/* =========================================
            PRODUTOS RELACIONADOS
            ========================================= */}
        {produtosRelacionados.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6 mt-4">
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