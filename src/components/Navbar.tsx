import React from 'react';
import Link from 'next/link';
import Searchbar from './Searchbar';
import { Menu, UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 inset-x-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-orange-500 text-white p-2 rounded-xl">
            {/* Você pode trocar por um ícone de sua preferência ou SVG */}
            <span className="font-black text-xl leading-none">B</span>
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 hidden sm:block">
            Baratinho<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* BARRA DE BUSCA (Centro) */}
        <div className="flex-1 max-w-2xl flex justify-center">
           <Searchbar />
        </div>

        {/* MENU DIREITO */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Botão de busca mobile (apenas em telas muito pequenas) */}
          <button className="md:hidden p-2 text-slate-500 hover:text-orange-500 transition-colors">
            <Menu size={24} strokeWidth={2.5} />
          </button>

          <button className="hidden sm:flex items-center gap-2 font-bold text-slate-600 hover:text-orange-500 transition-colors">
            <UserCircle size={24} strokeWidth={2.5} />
            <span>Entrar</span>
          </button>
        </div>

      </div>
    </header>
  );
}