"use client";

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PriceChart({ dataGrafico }: { dataGrafico: any[] }) {
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-bold border border-slate-700">
          <p className="mb-1 text-slate-400">{payload[0].payload.mes}</p>
          <p className="text-sm font-black text-red-400">{formatarMoeda(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dataGrafico} margin={{ top: 15, right: 15, left: -20, bottom: 10 }}>
        {/* Linhas de grade sutis ao fundo */}
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        
        {/* Eixo X (Meses) */}
        <XAxis 
          dataKey="mes" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} 
          dy={10}
        />
        
        {/* Eixo Y (Valores) - Escondido para design limpo */}
        <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
        
        {/* Balão interativo */}
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffe4e6', strokeWidth: 2 }} />
        
        {/* A LINHA DE VERDADE (VERMELHA E ELEGANTE) */}
        <Line 
          type="monotone" 
          dataKey="valor" 
          stroke="#e11d48" 
          strokeWidth={4} 
          dot={{ r: 5, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }} 
          activeDot={{ r: 8, fill: '#be123c', stroke: '#fff', strokeWidth: 2 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}