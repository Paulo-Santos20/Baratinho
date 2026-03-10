"use client";

import React, { useState } from 'react';
import { Tag, Check } from 'lucide-react';

export default function CouponCopy({ cupom }: { cupom: string }) {
  const [copiado, setCopiado] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cupom);
      setCopiado(true);
      
      // Volta ao estado normal após 2 segundos (UI/UX de Excelência)
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  return (
    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 flex items-center justify-between mb-6">
      <div className="flex items-center gap-2 text-slate-600">
        <Tag size={16} />
        <span className="text-sm font-bold truncate max-w-[120px]">{cupom}</span>
      </div>
      <button 
        onClick={handleCopy}
        className={`flex items-center gap-1 text-xs font-black uppercase tracking-wider transition-colors ${
          copiado ? 'text-green-600' : 'text-orange-500 hover:text-orange-600'
        }`}
      >
        {copiado ? (
          <>
            <Check size={14} strokeWidth={3} /> Copiado!
          </>
        ) : (
          'Copiar'
        )}
      </button>
    </div>
  );
}