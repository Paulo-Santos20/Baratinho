"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import DealCard from '@/components/DealCard';
import { Heart, Bell, Settings, LogOut, Loader2, HeartCrack, ChevronRight } from 'lucide-react';

export default function PerfilPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('salvos');
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);

  // Proteção de Rota: Redireciona se não estiver logado
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Busca as ofertas salvas (Por enquanto, busca tudo e filtra no cliente simulando o salvamento)
  useEffect(() => {
    const fetchSavedDeals = async () => {
      if (!user) return;
      setIsLoadingDeals(true);
      try {
        const q = query(collection(db, "ofertas"), orderBy("dataCriacao", "desc"));
        const snapshot = await getDocs(q);
        
        const dealsArray = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            dataCriacao: data.dataCriacao?.toMillis ? data.dataCriacao.toMillis() : Date.now()
          };
        });

        // FUTURO: Aqui filtraremos onde deal.likes.includes(user.uid)
        // Por enquanto, deixamos um mock ou array vazio para ver o Empty State
        const favoritosDoUsuario = dealsArray.filter(deal => deal.likes && deal.likes.includes(user.uid));
        setSavedDeals(favoritosDoUsuario);
      } catch (error) {
        console.error("Erro ao buscar salvos:", error);
      } finally {
        setIsLoadingDeals(false);
      }
    };

    fetchSavedDeals();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12 max-w-6xl">
        
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* MENU LATERAL DO PERFIL */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full p-1 border-4 border-orange-100 mb-4">
                <img src={user.photoURL || "https://placehold.co/200x200"} alt={user.displayName || "Usuário"} className="w-full h-full rounded-full object-cover" />
              </div>
              <h1 className="text-xl font-black text-slate-800">{user.displayName}</h1>
              <p className="text-sm font-medium text-slate-500 mb-6">{user.email}</p>
              
              <div className="w-full flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="block text-2xl font-black text-orange-500">{savedDeals.length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salvos</span>
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="block text-2xl font-black text-slate-800">0</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alertas</span>
                </div>
              </div>
            </div>

            <nav className="bg-white rounded-[2rem] p-3 shadow-sm border border-slate-100 flex flex-col gap-1">
              <MenuButton 
                active={activeTab === 'salvos'} 
                onClick={() => setActiveTab('salvos')} 
                icon={<Heart size={20} className={activeTab === 'salvos' ? "fill-orange-500" : ""} />} 
                label="Ofertas Salvas" 
              />
              <MenuButton 
                active={activeTab === 'alertas'} 
                onClick={() => setActiveTab('alertas')} 
                icon={<Bell size={20} />} 
                label="Meus Alertas" 
              />
              <MenuButton 
                active={activeTab === 'configuracoes'} 
                onClick={() => setActiveTab('configuracoes')} 
                icon={<Settings size={20} />} 
                label="Configurações" 
              />
              <div className="h-px bg-slate-100 my-2 mx-4"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={20} /> Sair da conta
                </div>
              </button>
            </nav>
          </aside>

          {/* ÁREA DE CONTEÚDO PRINCIPAL */}
          <div className="flex-grow">
            
            {activeTab === 'salvos' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-800">Minhas Pechinchas</h2>
                </div>

                {isLoadingDeals ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => <div key={n} className="h-96 bg-slate-200/60 animate-pulse rounded-[2rem]" />)}
                  </div>
                ) : savedDeals.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center border border-slate-100 shadow-sm min-h-[400px]">
                    <HeartCrack size={64} className="text-slate-200 mb-6" strokeWidth={1.5} />
                    <h2 className="text-2xl font-black text-slate-800 mb-3">Nenhuma oferta salva</h2>
                    <p className="text-slate-500 font-medium max-w-sm mb-8">Você ainda não guardou nenhuma pechincha. Volte para a página inicial e clique no coração para salvar suas favoritas aqui.</p>
                    <button onClick={() => router.push('/')} className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-slate-800 transition-colors">
                      Explorar Ofertas
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="bg-white rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center border border-slate-100 shadow-sm min-h-[400px] animate-in fade-in">
                <Bell size={64} className="text-slate-200 mb-6" strokeWidth={1.5} />
                <h2 className="text-2xl font-black text-slate-800 mb-3">Alertas Inteligentes</h2>
                <p className="text-slate-500 font-medium max-w-sm mb-6">Em breve! Você poderá avisar ao nosso robô: "Quero um iPhone por R$3.000" e ele te enviará um WhatsApp assim que encontrar.</p>
                <div className="bg-orange-50 text-orange-600 font-bold px-4 py-2 rounded-lg text-sm">
                  Funcionalidade em desenvolvimento
                </div>
              </div>
            )}

            {activeTab === 'configuracoes' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Configurações da Conta</h2>
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome de Exibição</label>
                    <input type="text" disabled value={user.displayName || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-medium outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Cadastrado</label>
                    <input type="email" disabled value={user.email || ''} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 font-medium outline-none" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-4">Sua conta está vinculada de forma segura através do Google. Não é possível alterar a senha por aqui.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

function MenuButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl font-bold transition-all ${
        active 
          ? 'bg-orange-50 text-orange-600' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon} {label}
      </div>
      <ChevronRight size={16} className={active ? "text-orange-500" : "text-slate-300"} />
    </button>
  );
}