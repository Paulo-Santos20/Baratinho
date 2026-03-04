"use client";
import { Scissors, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function CouponCard({ coupon }: { coupon: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border-2 border-dashed border-orange-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
      <div className="bg-orange-100 p-3 rounded-full mb-4">
        <Scissors className="text-orange-600" size={24} />
      </div>
      
      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
        {coupon.store}
      </span>
      
      <h3 className="font-bold text-slate-800 mb-4 line-clamp-2">
        {coupon.description}
      </h3>

      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between group cursor-pointer" onClick={handleCopy}>
        <code className="font-mono font-black text-slate-900">{coupon.code}</code>
        {copied ? <Check className="text-green-500" size={18} /> : <Copy className="text-slate-400 group-hover:text-orange-500" size={18} />}
      </div>
      
      <p className="text-[10px] text-slate-400 mt-3 italic">*Válido até {coupon.expiryDate}</p>
    </div>
  );
}