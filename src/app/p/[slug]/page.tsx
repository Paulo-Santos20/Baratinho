import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { ShoppingBag, ShieldCheck, Share2 } from 'lucide-react';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // Busca o produto no Firebase pelo slug (URL amigável)
  const q = query(collection(db, "ofertas"), where("slug", "==", params.slug));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return <div className="p-20 text-center">Produto não encontrado.</div>;
  
  const product = snapshot.docs[0].data();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Lado Esquerdo: Imagem */}
          <div className="bg-slate-50 rounded-[3rem] p-10 flex items-center justify-center border border-slate-100">
            <img src={product.imagemUrl} alt={product.titulo} className="max-h-[400px] object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500" />
          </div>

          {/* Lado Direito: Info e Teoria das Cores (Ação) */}
          <div className="space-y-6">
            <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              Oportunidade na {product.loja}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
              {product.titulo}
            </h1>
            
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 line-through text-lg">De R$ {product.precoAntigo.toFixed(2)}</span>
              <span className="text-5xl font-black text-orange-500 tracking-tighter">
                R$ {product.preco.toFixed(2)}
              </span>
            </div>

            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700">
              <ShieldCheck size={24} />
              <p className="text-sm font-bold">Vendido e entregue por uma loja verificada.</p>
            </div>

            <a 
              href={product.urlAfiliado} 
              target="_blank"
              className="block w-full bg-orange-500 text-white text-center py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-200 hover:bg-orange-600 active:scale-95 transition-all"
            >
              IR PARA A LOJA <ShoppingBag className="inline ml-2" />
            </a>

            <button className="w-full flex items-center justify-center gap-2 text-slate-400 font-bold py-4 hover:text-orange-500 transition">
              <Share2 size={20} /> Compartilhar esta pechincha
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}