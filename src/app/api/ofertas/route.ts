import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const generateSlug = (text: string) => {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validação básica de segurança
    if (!data.titulo || !data.preco || !data.urlAfiliado) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const slug = generateSlug(data.titulo) + '-' + Math.floor(Math.random() * 10000);

    const novaOferta = {
      titulo: data.titulo,
      descricao: data.descricao || '<p>Oferta adicionada manualmente.</p>',
      preco: Number(data.preco),
      precoAntigo: Number(data.precoAntigo) || Number(data.preco),
      loja: data.loja || 'Loja Parceira',
      imagemUrl: data.imagemUrl || 'https://placehold.co/800x800?text=Sem+Imagem',
      urlAfiliado: data.urlAfiliado,
      cupom: data.cupom || null,
      categoria: data.categoria || 'Geral',
      slug: slug,
      externalId: `manual-${Date.now()}`,
      dataCriacao: new Date(),
      hot: true,
      origem: 'manual'
    };

    const docRef = await adminDb.collection('ofertas').add(novaOferta);

    return NextResponse.json({ success: true, id: docRef.id, slug });
  } catch (error: any) {
    console.error("Erro ao salvar oferta manual:", error);
    return NextResponse.json({ error: 'Erro ao salvar a oferta no banco de dados.' }, { status: 500 });
  }
}