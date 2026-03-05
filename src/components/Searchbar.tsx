"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function Searchbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que a página recarregue ao dar Enter
    
    if (query.trim().length > 0) {
      // Codifica a busca (transforma espaços em %20) e redireciona
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className="relative w-full max-w-lg group flex-1 hidden md:block" // Escondido no mobile ultra-pequeno por padrão, visível a partir do tablet (ajustaremos a Navbar para mobile-first a seguir)
    >
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search size={18} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" strokeWidth={2.5} />
      </div>
      
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar pechinchas (ex: iPhone, Monitor Gamer...)"
        className="w-full bg-slate-100 text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-medium rounded-full py-3.5 pl-12 pr-6 outline-none border-2 border-transparent focus:bg-white focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100 transition-all"
      />
      
      {/* Botão invisível apenas para garantir o envio pelo teclado do celular/Enter */}
      <button type="submit" className="hidden">Buscar</button>
    </form>
  );
}