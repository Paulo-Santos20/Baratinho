import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// FUNÇÃO GET: Busca todas as ofertas para a tabela do Admin
export async function GET() {
  try {
    const snapshot = await adminDb.collection('ofertas').orderBy('dataCriacao', 'desc').get();
    const ofertas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(ofertas);
  } catch (error) {
    console.error("Erro ao buscar ofertas:", error);
    return NextResponse.json({ error: 'Erro ao carregar os dados.' }, { status: 500 });
  }
}

// FUNÇÃO POST: Salva novas ofertas manuais (Mantida intacta)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.titulo || !data.preco || !data.urlAfiliado) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const slug = data.titulo.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') + '-' + Math.floor(Math.random() * 10000);

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
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar.' }, { status: 500 });
  }
}

// FUNÇÃO DELETE: Apaga a oferta do banco de dados
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });

    await adminDb.collection('ofertas').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar.' }, { status: 500 });
  }
}