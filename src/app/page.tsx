"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import {
  Flame, Clock, TrendingDown, Heart, Grid,
  User, Ticket, Star, HeartCrack, Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DealCard from '@/components/DealCard';
import { useAuth } from '@/contexts/AuthContext';

export default function BaratinhoHome() {
  const { user } = useAuth();
  
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [displayDeals, setDisplayDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('destaques'); // destaques | recentes | menor | salvos

  // 1. BUSCA O LOTE DE OFERTAS NO BANCO
  useEffect(() => {
    // Buscamos um lote maior (60) para o nosso Motor de Curadoria ter opções para filtrar e ordenar
    const q = query(collection(db, "ofertas"), orderBy("dataCriacao", "desc"), limit(60));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dealsArray = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Conversor Mágico de Tempo
        let dataCriacaoFormatada = Date.now();
        if (data.dataCriacao) {
          if (typeof data.dataCriacao.toMillis === 'function') {
            dataCriacaoFormatada = data.dataCriacao.toMillis();
          } else if (data.dataCriacao._seconds) {
            dataCriacaoFormatada = data.dataCriacao._seconds * 1000;
          } else {
            dataCriacaoFormatada = new Date(data.dataCriacao).getTime();
          }
        }

        return { 
          id: doc.id, 
          ...data,
          dataCriacao: dataCriacaoFormatada 
        };
      });
      
      setAllDeals(dealsArray);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // 2. MOTOR DE CURADORIA INTELIGENTE (Roda sempre que clica numa aba)
  useEffect(() => {
    if (allDeals.length === 0) return;

    let result = [...allDeals];

    if (activeFilter === 'destaques') {
      // Cálculo de Relevância: Mix de Desconto + Tempo recente
      result.sort((a, b) => {
        const getScore = (deal: any) => {
          const hoursOld = (Date.now() - deal.dataCriacao) / (1000 * 60 * 60);
          const discountPct = (deal.precoAntigo > deal.preco) ? ((deal.precoAntigo - deal.preco) / deal.precoAntigo) * 100 : 0;
          const interactions = (deal.comentarios || 0) * 2; // Peso extra se o produto tem comentários
          
          // O Score sobe com desconto/interações, e cai conforme o produto envelhece
          return discountPct + interactions - (hoursOld * 1.5); 
        };
        return getScore(b) - getScore(a);
      });
    } 
    else if (activeFilter === 'recentes') {
      // Ordem cronológica (Mais novos primeiro)
      result.sort((a, b) => b.dataCriacao - a.dataCriacao);
    } 
    else if (activeFilter === 'menor') {
      // Filtra quem tem desconto real e ordena pelo MAIOR % de desconto
      result = result
        .filter(d => d.precoAntigo > d.preco)
        .sort((a, b) => {
          const descA = ((a.precoAntigo - a.preco) / a.precoAntigo);
          const descB = ((b.precoAntigo - b.preco) / b.precoAntigo);
          return descB - descA;
        });
    }
    else if (activeFilter === 'salvos') {
      // Sistema de favoritos
      if (!user) {
        result = []; // Força lista vazia para exibir o aviso de login
      } else {
        // Filtra pelos IDs salvos (Requer implementação da gravação de likes no Firebase futuramente)
        // Por enquanto, checa se existe a array local 'likes' contendo o UID do usuário
        result = result.filter(deal => deal.likes && deal.likes.includes(user.uid)); 
      }
    }

    // Exibimos apenas os 20 melhores de cada categoria para não pesar a tela
    setDisplayDeals(result.slice(0, 20)); 
  }, [allDeals, activeFilter, user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-24 md:pb-12">
        {/* STORIES SECTION - Estilo Instagram */}
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-4">
          {[
            { label: 'Dicas', icon: '💡', color: 'bg-amber-400' },
            { label: 'Alertas', icon: '🔔', color: 'bg-red-500' },
            { label: 'Grupos', icon: '📱', color: 'bg-emerald-500' },
            { label: 'FAQ', icon: '❓', color: 'bg-blue-500' },
            { label: 'Recebidos', icon: '🎁', color: 'bg-purple-500' },
          ].map((story, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="w-16 h-16 rounded-full p-1 border-2 border-orange-500 flex items-center justify-center bg-white shadow-sm cursor-pointer hover:scale-105 transition">
                <div className={`${story.color} w-full h-full rounded-full flex items-center justify-center text-2xl`}>
                  {story.icon}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{story.label}</span>
            </div>
          ))}
        </div>

        {/* 3. AS ABAS FUNCIONAIS DE EXCELÊNCIA */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-6 items-center border-b border-slate-200">
          <FilterBtn 
            icon={<Star size={16} className={activeFilter === 'destaques' ? "fill-current" : ""} />} 
            label="Destaques" 
            active={activeFilter === 'destaques'} 
            onClick={() => setActiveFilter('destaques')} 
          />
          <FilterBtn 
            icon={<Clock size={16} />} 
            label="Recentes" 
            active={activeFilter === 'recentes'} 
            onClick={() => setActiveFilter('recentes')} 
          />
          <FilterBtn 
            icon={<TrendingDown size={16} />} 
            label="Menor Preço" 
            active={activeFilter === 'menor'} 
            onClick={() => setActiveFilter('menor')} 
          />
          <FilterBtn 
            icon={<Heart size={16} className={activeFilter === 'salvos' ? "fill-current" : ""} />} 
            label="Salvos" 
            active={activeFilter === 'salvos'} 
            onClick={() => setActiveFilter('salvos')} 
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* CONTEÚDO PRINCIPAL (LISTA DE OFERTAS) */}
          <div className="flex-grow">
            
            {/* ESTADOS DE CARREGAMENTO E VAZIO (UI/UX) */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <div key={n} className="h-96 bg-slate-200/60 animate-pulse rounded-[2rem]" />)}
              </div>
            ) : displayDeals.length === 0 ? (
              
              // TELA PARA QUANDO A ABA ESTIVER VAZIA (Principalmente aba "Salvos")
              <div className="bg-white rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center border border-slate-100 shadow-sm min-h-[400px]">
                {activeFilter === 'salvos' && !user ? (
                  <>
                    <User size={64} className="text-slate-200 mb-6" strokeWidth={1.5} />
                    <h2 className="text-2xl font-black text-slate-800 mb-3">Conecte-se para salvar</h2>
                    <p className="text-slate-500 font-medium max-w-sm mb-6">Faça login para criar a sua pasta privada com as melhores ofertas do dia.</p>
                  </>
                ) : (
                  <>
                    <HeartCrack size={64} className="text-slate-200 mb-6" strokeWidth={1.5} />
                    <h2 className="text-2xl font-black text-slate-800 mb-3">Nenhuma oferta por aqui</h2>
                    <p className="text-slate-500 font-medium max-w-sm">Tente mudar de aba ou volte mais tarde para ver novidades fresquinhas.</p>
                  </>
                )}
              </div>

            ) : (
              // GRID DE OFERTAS COM OS CARDS
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {displayDeals.map((deal: any) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR DESKTOP - VISTOS RECENTES */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Flame size={18} className="text-orange-500" /> Mais Quentes
              </h3>
              <div className="space-y-4">
                {allDeals.slice(0, 4).map((deal: any) => (
                  <div key={deal.id} className="flex gap-4 group cursor-pointer border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 p-1.5">
                      <img src={deal.imagemUrl} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="text-xs font-bold line-clamp-2 text-slate-600 group-hover:text-orange-600 transition leading-tight">{deal.titulo}</h4>
                      <p className="text-red-600 font-black text-sm mt-1.5 leading-none">R$ {deal.preco?.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 text-white/10 rotate-12">
                <Flame size={140} />
              </div>
              <h3 className="font-black text-2xl mb-2 relative z-10 leading-tight">Receba no<br/>WhatsApp</h3>
              <p className="text-sm text-orange-50 mb-6 relative z-10 font-medium">As melhores pechinchas apitam no seu celular primeiro.</p>
              <button className="w-full bg-white text-orange-600 font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg relative z-10">
                ENTRAR NO GRUPO
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavIcon icon={<Grid size={24} />} label="Menu" />
        <NavIcon icon={<Ticket size={24} />} label="Cupons" />
        <div className="bg-orange-500 p-4 rounded-full -mt-10 border-4 border-[#F8FAFC] shadow-xl text-white transform hover:scale-105 transition cursor-pointer">
          <Flame size={28} />
        </div>
        <NavIcon icon={<Heart size={24} />} label="Salvos" />
        <NavIcon icon={<User size={24} />} label="Perfil" />
      </div>
    </div>
  );
}

// COMPONENTE DO BOTÃO DE ABA (FILTER)
function FilterBtn({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// COMPONENTE DO MENU MOBILE
function NavIcon({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-orange-500 transition-colors active:scale-95">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}