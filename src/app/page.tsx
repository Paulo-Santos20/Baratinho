"use client";
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { 
  Flame, Clock, TrendingUp, Bell, Ticket, Grid, 
  User, Search, Heart, Share2, MessageCircle 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import DealCard from '@/components/DealCard';

export default function BaratinhoHome() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "ofertas"), orderBy("dataCriacao", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dealsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeals(dealsArray as any);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-20 pb-24 md:pb-12">
        {/* STORIES SECTION - Estilo Instagram/Pechinchou */}
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-6 pt-4">
          {[
            { label: 'Dicas', icon: '💡', color: 'bg-orange-500' },
            { label: 'Alertas', icon: '🔔', color: 'bg-red-500' },
            { label: 'Grupos', icon: '📱', color: 'bg-green-500' },
            { label: 'FAQ', icon: '❓', color: 'bg-blue-500' },
            { label: 'Recebidos', icon: '🎁', color: 'bg-purple-500' },
          ].map((story, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className={`w-16 h-16 rounded-full p-1 border-2 border-orange-500 flex items-center justify-center bg-white shadow-sm cursor-pointer hover:scale-105 transition`}>
                <div className={`${story.color} w-full h-full rounded-full flex items-center justify-center text-2xl`}>
                  {story.icon}
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{story.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* CONTEÚDO PRINCIPAL */}
          <div className="flex-grow">
            {/* FILTROS RÁPIDOS */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
              <FilterBtn icon={<Flame size={16}/>} label="Destaques" active />
              <FilterBtn icon={<Clock size={16}/>} label="Recentes" />
              <FilterBtn icon={<TrendingUp size={16}/>} label="Em Alta" />
              <FilterBtn icon={<Bell size={16}/>} label="Meus Alertas" />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-96 bg-gray-200 animate-pulse rounded-[2rem]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {deals.map((deal: any) => <DealCard key={deal.id} deal={deal} />)}
              </div>
            )}
          </div>

          {/* SIDEBAR DESKTOP - VISTOS RECENTES */}
          <aside className="hidden lg:block w-80 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-orange-500" /> Vistos recentes
              </h3>
              <div className="space-y-4">
                {deals.slice(0, 3).map((deal: any) => (
                  <div key={deal.id} className="flex gap-3 group cursor-pointer">
                    <img src={deal.imagemUrl} className="w-16 h-16 rounded-xl object-contain bg-slate-50 p-1" />
                    <div>
                      <h4 className="text-xs font-bold line-clamp-2 group-hover:text-orange-600 transition">{deal.titulo}</h4>
                      <p className="text-orange-600 font-black text-sm">R$ {deal.preco.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200">
              <h3 className="font-bold text-lg mb-2">Receba no WhatsApp</h3>
              <p className="text-sm text-orange-100 mb-4">Não perca nenhuma pechincha. Entre no grupo!</p>
              <button className="w-full bg-white text-orange-600 font-bold py-3 rounded-2xl hover:bg-orange-50 transition">
                ENTRAR AGORA
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
        <NavIcon icon={<Grid />} label="Categorias" />
        <NavIcon icon={<Ticket />} label="Cupons" />
        <div className="bg-orange-500 p-4 rounded-full -mt-12 border-4 border-[#F8FAFC] shadow-xl text-white">
          <Flame size={24} />
        </div>
        <NavIcon icon={<Heart />} label="Salvos" />
        <NavIcon icon={<User />} label="Perfil" />
      </div>
    </div>
  );
}

function FilterBtn({ icon, label, active = false }: any) {
  return (
    <button className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
      active ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-slate-500 hover:bg-orange-50'
    }`}>
      {icon} {label}
    </button>
  );
}

function NavIcon({ icon, label }: any) {
  return (
    <button className="flex flex-col items-center gap-1 text-slate-400">
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}