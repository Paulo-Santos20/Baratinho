"use client"; 

import React from 'react';
import Link from 'next/link';
import Searchbar from './Searchbar';
import { Menu, UserCircle, LogOut, ShieldAlert } from 'lucide-react';
// Importar o nosso hook de autenticação
import { useAuth } from '@/contexts/AuthContext';

// Trava de segurança: E-mail exclusivo do Administrador
const ADMIN_EMAIL = "crossbrasil2018@gmail.com";

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  
  // Verifica se o usuário logado é o administrador
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 fixed top-0 inset-x-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="bg-orange-500 text-white p-2 rounded-xl group-hover:bg-orange-600 transition-colors shadow-sm">
            <span className="font-black text-xl leading-none">B</span>
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900 hidden sm:block group-hover:text-orange-500 transition-colors">
            Baratinho<span className="text-orange-500">.</span>
          </span>
        </Link>

        {/* BARRA DE BUSCA */}
        <div className="flex-1 max-w-2xl flex justify-center">
           <Searchbar />
        </div>

        {/* MENU DIREITO - COM LÓGICA DE AUTENTICAÇÃO E ADMIN */}
        <div className="flex items-center gap-3 flex-shrink-0">
          
          {/* BOTÃO SECRETO DO ADMIN (Aparece apenas para o e-mail autorizado) */}
          {isAdmin && (
            <Link 
              href="/admin/nova" 
              className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors border border-red-100 shadow-sm"
              title="Acessar Painel Admin"
            >
              <ShieldAlert size={20} strokeWidth={2.5} />
              <span className="hidden lg:block text-sm font-bold">Painel Admin</span>
            </Link>
          )}

          <button className="md:hidden p-2 text-slate-500 hover:text-orange-500 transition-colors">
            <Menu size={24} strokeWidth={2.5} />
          </button>

          {user ? (
            // Se tiver sessão iniciada, mostra o perfil e o botão de sair
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-100 transition-colors hover:bg-slate-100">
                <img 
                  src={user.photoURL || "https://placehold.co/100x100"} 
                  alt={user.displayName || "Perfil"} 
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                />
                <span className="text-sm font-bold text-slate-700 max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0]} {/* Mostra apenas o primeiro nome */}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-full hover:bg-red-50"
                title="Terminar Sessão"
              >
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            // Se NÃO tiver sessão iniciada, mostra o botão Entrar
            <button 
              onClick={signInWithGoogle}
              className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 text-sm"
            >
              <UserCircle size={18} strokeWidth={2.5} />
              <span>Entrar</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}