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
    const AWIN_FEED_URL = process.env.AWIN_FEED_URL;

    if (!AWIN_FEED_URL) {
      return NextResponse.json({ 
        error: "Falta configurar a variável AWIN_FEED_URL no arquivo .env.local" 
      }, { status: 500 });
    }

    // Limpa possíveis espaços vazios que vieram na hora do copia e cola
    const cleanUrl = AWIN_FEED_URL.trim().replace(/['"]/g, '');

    const response = await fetch(cleanUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000) 
    });

    // 🚨 A MÁGICA DO DEBUG ESTÁ AQUI 🚨
    if (!response.ok) {
      const errorText = await response.text(); 
      
      // Tratamento BLINDADO: Converte tudo para minúsculo para o HTML não nos enganar
      if (errorText.toLowerCase().includes("no products found")) {
        return NextResponse.json({ 
          status: '⚠️ AWIN AVISOU: Seu link está certo, mas não há produtos disponíveis neste momento. Verifique se os anunciantes já aprovaram sua conta.', 
          novosProdutos: 0 
        });
      }

      console.error("🔥 MOTIVO REAL DA AWIN:", errorText);
      throw new Error(`A API da Awin recusou a conexão. Status: ${response.status} - Detalhe: ${errorText}`);
    }
    
    const jsonResponse = await response.json();
    
    const productsList = jsonResponse.data || jsonResponse || [];

    if (productsList.length === 0) {
      return NextResponse.json({ message: "O feed da Awin está vazio ou não retornou produtos." });
    }

    let importedCount = 0;

    for (const product of productsList) {
      const productId = String(product.awin_product_reference || product.product_id || product.id);
      
      if (!productId || productId === "undefined") continue;

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const titulo = product.product_name || product.title || "Produto Parceiro";
        const slug = generateSlug(titulo);
        
        const precoReal = Number(product.search_price || product.price) || 0;
        const precoAntigo = Number(product.rrp_price || product.product_price_old || product.original_price) || (precoReal * 1.20);
        
        // Pega as colunas ricas que você ativou!
        const descricaoHtml = product.product_short_description || product.specifications || product.description || `<p>Oferta exclusiva verificada.</p>`;
        const merchantName = product.merchant_name || product.advertiser || "Loja Parceira Awin";
        
        const imagemUrl = product.large_image || product.aw_image_url || product.image_url || "";
        
        const awinDeepLink = product.awin_deep_link || product.url || "";
        const cupom = product.promotional_text || null;

        if (precoReal > 0 && awinDeepLink !== "") {
          await adminDb.collection("ofertas").add({
            titulo: titulo,
            descricao: descricaoHtml,
            preco: precoReal,
            precoAntigo: precoAntigo,
            loja: merchantName,
            imagemUrl: imagemUrl,
            urlAfiliado: awinDeepLink,
            externalId: productId,
            slug: slug,
            categoria: product.category_name || product.category || "Ofertas",
            cupom: cupom, 
            dataCriacao: new Date(),
            hot: true 
          });
          
          importedCount++;
        }
      }
    }

    return NextResponse.json({ 
      status: '✅ AWIN: Feed REAL sincronizado com sucesso!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA API DA AWIN:", error);
    return NextResponse.json({ 
      error: "Falha na sincronização da Awin", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}