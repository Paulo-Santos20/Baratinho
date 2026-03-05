import React from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import DealCard from '@/components/DealCard';
import { LayoutGrid, Frown } from 'lucide-react';

// Função para formatar o slug da URL de volta para o nome da categoria com letra maiúscula
const formatCategoryName = (slug: string) => {
  const decoded = decodeURIComponent(slug);
  return decoded.charAt(0).toUpperCase() + decoded.slice(1).replace(/-/g, ' ');
};

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryName = formatCategoryName(params.slug);
  
  // Busca as ofertas específicas dessa categoria no Firebase
  const q = query(
    collection(db, "ofertas"),
    where("categoria", "==", categoryName),
    // orderBy("dataCriacao", "desc") // Requer índice no Firebase para combinar where e orderBy
  );
  
  const snapshot = await getDocs(q);
  const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-24 md:pb-12">
        {/* Cabeçalho da Categoria focando em UI/UX de Excelência */}
        <header className="mb-10 flex items-center gap-4 border-b border-slate-200 pb-6">
          <div className="bg-orange-500 p-4 rounded-[1.5rem] text-white shadow-lg shadow-orange-200">
            <LayoutGrid size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              {categoryName}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Encontramos {deals.length} pechinchas imperdíveis para você.
            </p>
          </div>
        </header>

        {/* Grid Responsivo Mobile-First */}
        {deals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Frown size={48} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Poxa, nenhuma oferta ainda!</h2>
            <p className="text-slate-500 max-w-md">
              Nosso motor robótico ainda não encontrou promoções quentes para a categoria <strong className="text-orange-500">{categoryName}</strong> hoje. Volte mais tarde!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}