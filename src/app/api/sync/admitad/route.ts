import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Função auxiliar para criar a URL amigável (SEO)
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
    // A URL do Feed JSON que você vai gerar no painel da Admitad
    const ADMITAD_FEED_URL = process.env.ADMITAD_FEED_URL;

    // Trava de segurança: só roda com dados reais
    if (!ADMITAD_FEED_URL) {
      return NextResponse.json({ 
        error: "Falta configurar a variável ADMITAD_FEED_URL no arquivo .env.local" 
      }, { status: 500 });
    }

    // Limpa a URL de possíveis espaços ou aspas acidentais
    const cleanUrl = ADMITAD_FEED_URL.trim().replace(/['"]/g, '');

    const response = await fetch(cleanUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000) // Tempo estendido para feeds grandes
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Tratamento elegante para feeds vazios ou pendentes de aprovação
      if (errorText.toLowerCase().includes("no products") || errorText.toLowerCase().includes("empty")) {
         return NextResponse.json({ 
          status: '⚠️ ADMITAD AVISOU: Seu link está certo, mas não há produtos disponíveis. Verifique suas afiliações no painel.', 
          novosProdutos: 0 
        });
      }

      console.error("🔥 MOTIVO REAL DA ADMITAD:", errorText);
      throw new Error(`A API da Admitad recusou a conexão. Status: ${response.status} - Detalhe: ${errorText}`);
    }
    
    const jsonResponse = await response.json();
    
    // A Admitad pode enviar os produtos soltos no array ou dentro de um objeto 'products' ou 'data'
    const productsList = jsonResponse.products || jsonResponse.data || jsonResponse || [];

    if (productsList.length === 0) {
      return NextResponse.json({ message: "O feed da Admitad está vazio ou não retornou produtos." });
    }

    let importedCount = 0;

    // O LOOP TRADUTOR: Normaliza os dados da Admitad para a nossa Arquitetura Escalável
    for (const product of productsList) {
      // Pega o ID único (Admitad varia entre 'id', 'productId' ou 'offer_id')
      const productId = String(product.id || product.productId || product.offer_id);
      
      if (!productId || productId === "undefined") continue;

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const titulo = product.name || product.title || product.model || "Produto Parceiro";
        const slug = generateSlug(titulo);
        
        const precoReal = Number(product.price || product.current_price) || 0;
        const precoAntigo = Number(product.oldprice || product.old_price) || (precoReal * 1.20); // Simula 20% se não vier o preço antigo
        
        const descricaoHtml = product.description || `<p>Oferta exclusiva verificada através da Admitad.</p>`;
        const merchantName = product.vendor || product.merchant || product.program_name || "Loja Parceira";
        const imagemUrl = product.picture || product.image || product.image_url || "https://placehold.co/800x800?text=Sem+Imagem";
        
        // Link profundo já com a sua comissão da Admitad
        const urlAfiliado = product.url || product.affiliate_url || "";
        const cupom = product.promocode || product.coupon || null;

        if (precoReal > 0 && urlAfiliado !== "") {
          await adminDb.collection("ofertas").add({
            titulo: titulo,
            descricao: descricaoHtml,
            preco: precoReal,
            precoAntigo: precoAntigo,
            loja: merchantName,
            imagemUrl: imagemUrl,
            urlAfiliado: urlAfiliado,
            externalId: productId,
            slug: slug,
            categoria: product.categoryId || product.category_name || "Ofertas",
            cupom: cupom, 
            dataCriacao: new Date(),
            hot: true 
          });
          
          importedCount++;
        }
      }
    }

    return NextResponse.json({ 
      status: '✅ ADMITAD: Feed REAL sincronizado com sucesso!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA API DA ADMITAD:", error);
    return NextResponse.json({ 
      error: "Falha na sincronização da Admitad", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}