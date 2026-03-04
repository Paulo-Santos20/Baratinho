import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  

  try {
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
    const SOURCE_ID = process.env.LOMADEE_SOURCE_ID;
    
    // Busca focada em tecnologia e hardware
    const url = `https://api.lomadee.com/v2/${LOMADEE_TOKEN}/offer/_search?sourceId=${SOURCE_ID}&keyword=tecnologia&sort=relevance`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.offers) return NextResponse.json({ message: "Sem novas ofertas" });

    let importedCount = 0;

    for (const offer of data.offers) {
      // Busca por ID externo usando adminDb (mais rápido no servidor)
      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", offer.id)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const slug = offer.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Escrita direta no banco com privilégios de administrador
        await adminDb.collection("ofertas").add({
          titulo: offer.name,
          preco: offer.price,
          precoAntigo: offer.price * 1.15, // Simulação de preço original
          loja: offer.store.name,
          imagemUrl: offer.thumbnail,
          urlAfiliado: offer.link,
          externalId: offer.id,
          slug: slug,
          categoria: "Tecnologia",
          dataCriacao: new Date(), // Admin usa Date nativo ou FieldValue
          hot: offer.price < (offer.price * 0.9) // Lógica simples de "oferta quente"
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: 'Sincronização concluída', 
      novosProdutos: importedCount 
    });

  } catch (error) {
    return NextResponse.json({ error: "Erro na automação" }, { status: 500 });
  }
}