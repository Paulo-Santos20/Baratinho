"use client"; // Não se esqueça de adicionar isto no topo, pois agora tem interatividade!

import React from 'react';
import Link from 'next/link';
import Searchbar from './Searchbar';
import { Menu, UserCircle, LogOut } from 'lucide-react';
// Importar o nosso hook de autenticação
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 inset-x-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-orange-500 text-white p-2 rounded-xl">
            <span className="font-black text-xl leading-none">B</span>
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 hidden sm:block">
            Baratinho<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* BARRA DE BUSCA */}
        <div className="flex-1 max-w-2xl flex justify-center">
           <Searchbar />
        </div>

        {/* MENU DIREITO - COM LÓGICA DE AUTENTICAÇÃO */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="md:hidden p-2 text-slate-500 hover:text-orange-500 transition-colors">
            <Menu size={24} strokeWidth={2.5} />
          </button>

          {user ? (
            // Se tiver sessão iniciada, mostra o perfil e o botão de sair
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL || "https://placehold.co/100x100"} 
                  alt={user.displayName || "Perfil"} 
                  className="w-10 h-10 rounded-full border-2 border-orange-100 shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0]} {/* Mostra apenas o primeiro nome */}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-full"
                title="Terminar Sessão"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            // Se NÃO tiver sessão iniciada, mostra o botão Entrar
            <button 
              onClick={signInWithGoogle}
              className="hidden sm:flex items-center gap-2 font-bold text-slate-600 hover:text-orange-500 transition-colors"
            >
              <UserCircle size={24} strokeWidth={2.5} />
              <span>Entrar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}