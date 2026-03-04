"use client";
import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LayoutGrid, Plus, Image as ImageIcon, Link as LinkIcon, ShoppingBag, Send } from 'lucide-react';

export default function AdminPage() {
    const [form, setForm] = useState({ titulo: '', preco: '', precoAntigo: '', loja: '', urlAfiliado: '', cupom: '', imagemUrl: '' });
    const [loading, setLoading] = useState(false);
    // Dentro do componente AdminPage...
    const handleAutoImport = async (url: string) => {
        if (!url.startsWith('http')) return;
        setLoading(true);

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                body: JSON.stringify({ url }),
            });
            const data = await res.json();

            if (!data.error) {
                setForm({
                    ...form,
                    titulo: data.titulo || '',
                    imagemUrl: data.imagemUrl || '',
                    preco: data.preco || '',
                    loja: data.loja || '',
                    urlAfiliado: url // Link original para você transformar em afiliado
                });
            }
        } catch (err) {
            console.error("Erro ao importar", err);
        } finally {
            setLoading(false);
        }
    };

    // No campo de Link de Afiliado, adicione o trigger:
    <Input
        label="Colar Link da Loja"
        placeholder="https://www.amazon.com.br/produto..."
        onChange={(v) => {
            setForm({ ...form, urlAfiliado: v });
            if (v.length > 20) handleAutoImport(v); // Dispara a mágica automaticamente
        }}
    />
    const saveDeal = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "ofertas"), {
                ...form,
                preco: parseFloat(form.preco),
                precoAntigo: parseFloat(form.precoAntigo || '0'),
                dataCriacao: serverTimestamp()
            });
            alert("Sucesso!");
            setForm({ titulo: '', preco: '', precoAntigo: '', loja: '', urlAfiliado: '', cupom: '', imagemUrl: '' });
        } catch (err) { alert("Erro!"); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
            {/* SIDEBAR ADMIN */}
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6">
                <div className="flex items-center gap-2 mb-10">
                    <div className="bg-orange-500 p-2 rounded-xl">
                        <LayoutGrid size={20} />
                    </div>
                    <span className="font-black text-xl tracking-tighter">ADMIN</span>
                </div>
                <nav className="space-y-2">
                    <button className="w-full flex items-center gap-3 bg-slate-800 p-4 rounded-2xl font-bold text-orange-500">
                        <Plus size={20} /> Nova Oferta
                    </button>
                </nav>
            </aside>

            {/* FORMULÁRIO */}
            <main className="flex-grow p-4 md:p-12">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-10">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Publicar Pechincha</h1>
                        <p className="text-slate-500">Preencha os dados e a oferta aparecerá em tempo real.</p>
                    </header>

                    <form onSubmit={saveDeal} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* O Input da "Mágica" com a tipagem corrigida */}
                            <Input
                                label="Colar Link da Loja"
                                placeholder="https://www.amazon.com.br/produto..."
                                onChange={(v: string) => {
                                    setForm({ ...form, urlAfiliado: v });
                                    if (v.length > 20) handleAutoImport(v);
                                }}
                            />

                            <Input label="Título do Produto" icon={<ShoppingBag size={18} />} placeholder="Ex: iPhone 15 Pro" value={form.titulo} onChange={(v: string) => setForm({ ...form, titulo: v })} />
                            <Input label="Loja" icon={<ImageIcon size={18} />} placeholder="Amazon, Magalu..." value={form.loja} onChange={(v: string) => setForm({ ...form, loja: v })} />
                            <Input label="Preço Atual" type="number" placeholder="0.00" value={form.preco} onChange={(v: string) => setForm({ ...form, preco: v })} />
                            <Input label="Preço Antigo" type="number" placeholder="0.00" value={form.precoAntigo} onChange={(v: string) => setForm({ ...form, precoAntigo: v })} />
                            <Input label="URL da Imagem" icon={<ImageIcon size={18} />} placeholder="https://..." value={form.imagemUrl} onChange={(v: string) => setForm({ ...form, imagemUrl: v })} />
                            <Input label="Link de Afiliado" icon={<LinkIcon size={18} />} placeholder="https://..." value={form.urlAfiliado} onChange={(v: string) => setForm({ ...form, urlAfiliado: v })} />
                            <Input label="Cupom (Opcional)" placeholder="EX: BARATINHO10" value={form.cupom} onChange={(v: string) => setForm({ ...form, cupom: v })} />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-orange-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "POSTANDO..." : <><Send size={20} /> PUBLICAR NO BARATINHO</>}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

function Input({ label, icon, ...props }: any) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-400 uppercase ml-2">{label}</label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
                <input
                    {...props}
                    onChange={(e) => props.onChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-700"
                />
            </div>
        </div>
    );
}