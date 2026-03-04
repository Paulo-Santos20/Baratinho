"use client";
import { ExternalLink, Heart, MessageCircle, Share2, Tag, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function DealCard({ deal }: { deal: any }) {
    const [liked, setLiked] = useState(false);
    const formatPrice = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return (
        <div className="bg-white rounded-[2.5rem] p-5 border border-slate-100 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-500 group relative">
            {/* HEADER DO CARD: LOJA E TEMPO */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center">
                        <ShoppingBag size={14} className="text-orange-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{deal.loja}</span>
                </div>
                <div className="bg-orange-50 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-bold text-orange-600">há 5min</span>
                </div>
            </div>

            {/* IMAGEM COM BADGE DE DESCONTO */}
            <div className="relative aspect-[4/3] mb-4 bg-slate-50 rounded-[2rem] p-6 flex items-center justify-center group-hover:bg-white transition-colors">
                <img src={deal.imagemUrl} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                {deal.precoAntigo > deal.preco && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-2xl shadow-lg">
                        -{Math.round(((deal.precoAntigo - deal.preco) / deal.precoAntigo) * 100)}%
                    </div>
                )}
            </div>

            {/* TÍTULO */}
            <h3 className="font-bold text-slate-800 leading-tight mb-4 line-clamp-2 h-10 group-hover:text-orange-600 transition-colors">
                {deal.titulo}
            </h3>

            {/* PREÇO E CUPOM */}
            <div className="flex items-end justify-between mb-6">
                <div>
                    {deal.precoAntigo && <p className="text-xs text-slate-400 line-through">R$ {deal.precoAntigo}</p>}
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-orange-600">R$</span>
                        <span className="text-3xl font-black text-orange-600 tracking-tighter">{deal.preco.toFixed(2)}</span>
                    </div>
                </div>
                {deal.cupom && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Cupom</span>
                        <div className="bg-dashed border-2 border-dashed border-orange-200 bg-orange-50 px-3 py-1 rounded-lg">
                            <span className="text-xs font-mono font-bold text-orange-700 uppercase">{deal.cupom}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER: BOTÃO E INTERAÇÕES */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex gap-4">
                    <button onClick={() => setLiked(!liked)} className={`flex items-center gap-1.5 text-xs font-bold transition ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                        <Heart size={18} fill={liked ? "currentColor" : "none"} /> 12
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-500 transition">
                        <MessageCircle size={18} /> 4
                    </button>
                </div>
                <a
                    href={deal.urlAfiliado}
                    target="_blank"
                    className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-lg"
                >
                    <ExternalLink size={20} />
                </a>
            </div>
        </div>
    );
}