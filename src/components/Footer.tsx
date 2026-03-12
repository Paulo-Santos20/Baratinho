import React from 'react';
import Link from 'next/link';
import { Flame, Smartphone, ShieldCheck, Mail, Zap } from 'lucide-react';

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    // pb-24 no mobile para não ficar escondido atrás do menu inferior fixo que criamos!
    <footer className="bg-white border-t border-slate-100 pt-16 pb-24 md:pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* GRID PRINCIPAL DE LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* COLUNA 1: MARCA */}
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="bg-orange-500 p-2.5 rounded-xl group-hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                <Flame size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Baratinho</span>
            </Link>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
              O seu radar de ofertas em tempo real. Garimpamos os maiores descontos da internet para você economizar de verdade, todos os dias.
            </p>
            <a href="mailto:contato@baratinho.com" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-orange-500 transition-colors">
              <Mail size={18} className="text-slate-400" /> contato@baratinho.com
            </a>
          </div>

          {/* COLUNA 2: NAVEGAÇÃO */}
          <div>
            <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Explore</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-sm font-medium text-slate-500 hover:text-orange-500 transition-colors">Início</Link></li>
              <li><Link href="/busca?sort=destaques" className="text-sm font-medium text-slate-500 hover:text-orange-500 transition-colors">Destaques do Dia</Link></li>
              <li><Link href="/busca?sort=menor_preco" className="text-sm font-medium text-slate-500 hover:text-orange-500 transition-colors">Maiores Quedas</Link></li>
              <li><Link href="/perfil" className="text-sm font-medium text-slate-500 hover:text-orange-500 transition-colors">Minhas Pechinchas</Link></li>
            </ul>
          </div>

          {/* COLUNA 3: LEGAL E SEGURANÇA */}
          <div>
            <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Transparência</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2">
                <ShieldCheck size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-500 leading-snug">Lojas 100% verificadas por nossa equipe.</span>
              </li>
              <li><Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Termos de Uso</Link></li>
              <li><Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>

          {/* COLUNA 4: COMUNIDADE */}
          <div>
            <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest text-xs">Comunidade</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
              Não perca nenhum bug. Entre no nosso grupo VIP e seja o primeiro a saber.
            </p>
            <a href="#" target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white font-black py-3 px-4 rounded-xl hover:bg-[#20bd5a] transition-all shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 active:scale-95">
              <Smartphone size={18} /> Entrar no WhatsApp
            </a>
          </div>

        </div>

        {/* BARRA INFERIOR (COPYRIGHT E ASSINATURA DA OLIMPO) */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-400 text-center md:text-left">
            © {anoAtual} Baratinho. Todos os direitos reservados.
          </p>
          
          {/* ASSINATURA DA SUA EMPRESA (TUDO CLICÁVEL) */}
          <a 
            href="https://olimposolucao.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 py-2 px-4 rounded-full border border-slate-100 transition-colors group cursor-pointer"
          >
            Desenvolvido com ⚡ o raio de Zeus pela
            <span className="font-black text-slate-800 group-hover:text-orange-500 transition-colors flex items-center gap-1 ml-1">
              <Zap size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
              OLIMPO
            </span>
          </a>
        </div>

      </div>
    </footer>
  );
}