import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  // Lembre-se de deixar as validações de segurança comentadas por enquanto para testar no navegador!
  
  try {
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
    const SOURCE_ID = process.env.LOMADEE_SOURCE_ID;
    
    // DIAGNÓSTICO 1: Verifica as variáveis de ambiente
    if (!LOMADEE_TOKEN || !SOURCE_ID) {
      return NextResponse.json({ 
        error: "❌ Faltam chaves da Lomadee no arquivo .env.local",
        dica: "Adicione LOMADEE_TOKEN e LOMADEE_SOURCE_ID ao seu .env.local e reinicie o servidor."
      }, { status: 500 });
    }

    const url = `https://api.lomadee.com/v2/${LOMADEE_TOKEN}/offer/_search?sourceId=${SOURCE_ID}&keyword=tecnologia&sort=relevance`;
    
    const response = await fetch(url);
    const data = await response.json();

    // DIAGNÓSTICO 2: Verifica se a Lomadee bloqueou o acesso
    if (data.requestInfo && data.requestInfo.status === 'ERROR') {
      return NextResponse.json({ 
        error: "❌ A API da Lomadee recusou a conexão", 
        motivo: data.requestInfo.message 
      }, { status: 401 });
    }

    if (!data.offers) return NextResponse.json({ message: "Sem novas ofertas na Lomadee" });

    let importedCount = 0;

    for (const offer of data.offers) {
      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", offer.id)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const slug = offer.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

        await adminDb.collection("ofertas").add({
          titulo: offer.name,
          preco: offer.price,
          precoAntigo: offer.price * 1.15,
          loja: offer.store.name,
          imagemUrl: offer.thumbnail,
          urlAfiliado: offer.link,
          externalId: offer.id,
          slug: slug,
          categoria: "Tecnologia",
          dataCriacao: new Date(),
          hot: offer.price < (offer.price * 0.9)
        });
        importedCount++;
      }
    }

    return NextResponse.json({ status: '✅ Sincronização concluída', novosProdutos: importedCount });

  } catch (error: any) {
    // DIAGNÓSTICO 3: Mostra o erro real do Firebase ou Node.js
    console.error("🔥 ERRO DETALHADO NO TERMINAL:", error);
    return NextResponse.json({ 
      error: "❌ Falha crítica na automação", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}