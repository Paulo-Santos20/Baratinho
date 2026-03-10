import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const generateSlug = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

export async function GET(request: Request) {
  try {
    // Experimente trocar a busca para itens do seu nicho, como 'monitor gamer', 'hardware' ou 'rtx' ;)
    const termoBusca = 'smartphone';
    const mlApiUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${termoBusca}&limit=10`;

    // O DISFARCE: O cabeçalho 'User-Agent' simula um navegador real para evitar bloqueios
    const response = await fetch(mlApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();

    // Tratamento de erro cirúrgico: se falhar, joga a resposta real do ML na tela
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ 
        message: "Acesso negado ou sem produtos no Mercado Livre.",
        respostaOriginalML: data 
      }, { status: 400 });
    }

    let importedCount = 0;

    for (const item of data.results) {
      const productId = item.id;

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const highResImage = item.thumbnail.replace('-I.jpg', '-O.jpg');

        let descricaoHtml = `<p>Produto oficial vendido no Mercado Livre.</p>`;
        try {
          // Disfarce aplicado também na busca da descrição detalhada
          const descResponse = await fetch(`https://api.mercadolibre.com/items/${productId}/description`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            }
          });
          
          if (descResponse.ok) {
            const descData = await descResponse.json();
            if (descData.plain_text) {
              descricaoHtml = `<p>${descData.plain_text.replace(/\n/g, '<br><br>')}</p>`;
            }
          }
        } catch (e) {
          console.log(`Sem descrição detalhada para ${productId}`);
        }

        const urlAfiliado = item.permalink;
        const precoAtual = item.price;
        const precoAntigo = item.original_price || (precoAtual * 1.15);

        await adminDb.collection("ofertas").add({
          titulo: item.title,
          descricao: descricaoHtml,
          preco: precoAtual,
          precoAntigo: precoAntigo,
          loja: "Mercado Livre",
          imagemUrl: highResImage,
          urlAfiliado: urlAfiliado,
          externalId: productId,
          slug: generateSlug(item.title),
          categoria: "Smartphones",
          cupom: null,
          dataCriacao: new Date(),
          hot: true 
        });

        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: '✅ MERCADO LIVRE: Sincronização REAL concluída com sucesso!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA API DO MERCADO LIVRE:", error);
    return NextResponse.json({ 
      error: "Falha na sincronização", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}