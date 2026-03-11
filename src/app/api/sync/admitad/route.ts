import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { XMLParser } from 'fast-xml-parser';

// AUMENTA O TEMPO LIMITE DA VERCEL PARA 60 SEGUNDOS (Máximo do plano gratuito)
export const maxDuration = 60; 

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
    const ADMITAD_FEED_URL = process.env.ADMITAD_FEED_URL;

    if (!ADMITAD_FEED_URL) {
      return NextResponse.json({ 
        error: "Falta configurar a variável ADMITAD_FEED_URL no arquivo .env.local" 
      }, { status: 500 });
    }

    const cleanUrl = ADMITAD_FEED_URL.trim().replace(/['"]/g, '');

    const response = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(60000) // O robô agora tem 1 minuto inteiro de fôlego
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (errorText.toLowerCase().includes("no products") || errorText.toLowerCase().includes("empty")) {
         return NextResponse.json({ 
          status: '⚠️ ADMITAD AVISOU: Seu link está certo, mas não há produtos disponíveis. Verifique suas afiliações no painel.', 
          novosProdutos: 0 
        });
      }

      console.error("🔥 MOTIVO REAL DA ADMITAD:", errorText);
      throw new Error(`A API da Admitad recusou a conexão. Status: ${response.status}`);
    }
    
    // Como é XML, nós lemos como Texto Puro primeiro
    const xmlText = await response.text();

    if (!xmlText || xmlText.trim() === "") {
      return NextResponse.json({ message: "O feed da Admitad retornou um arquivo vazio." });
    }

    // Configuração do tradutor XML (Mantendo os atributos das tags, como id="123")
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const jsonObj = parser.parse(xmlText);
    
    let productsList = [];

    // O padrão YML (Yandex Market Language) que a Admitad usa no XML
    if (jsonObj?.admitad_catalog?.shop?.offers?.offer) {
      productsList = jsonObj.admitad_catalog.shop.offers.offer;
    } else if (jsonObj?.yml_catalog?.shop?.offers?.offer) {
      productsList = jsonObj.yml_catalog.shop.offers.offer;
    }

    // Se vier apenas 1 produto, o parser não cria um Array. Forçamos a ser um Array para o loop não quebrar.
    if (productsList && !Array.isArray(productsList)) {
      productsList = [productsList];
    }

    if (!productsList || productsList.length === 0) {
      return NextResponse.json({ 
        status: '⚠️ Feed recebido, mas a lista de ofertas (<offer>) está vazia. Aguarde os anunciantes liberarem os produtos.', 
        novosProdutos: 0 
      });
    }

    let importedCount = 0;

    for (const product of productsList) {
      // No XML da Admitad, o ID geralmente é um atributo da tag: <offer id="12345">
      const productId = String(product["@_id"] || product.id);
      
      if (!productId || productId === "undefined") continue;

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const titulo = product.name || product.model || "Produto Parceiro";
        const slug = generateSlug(titulo);
        
        const precoReal = Number(product.price) || 0;
        const precoAntigo = Number(product.oldprice) || (precoReal * 1.20);
        
        const descricaoHtml = product.description || `<p>Oferta exclusiva verificada através da Admitad.</p>`;
        const merchantName = product.vendor || "Loja Parceira";
        const imagemUrl = product.picture || "https://placehold.co/800x800?text=Sem+Imagem";
        
        const urlAfiliado = product.url || "";
        const cupom = null; // XML da Admitad geralmente não expõe cupons diretamente na tag padrão

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
            categoria: product.categoryId || "Ofertas",
            cupom: cupom, 
            dataCriacao: new Date(),
            hot: true 
          });
          
          importedCount++;
        }
      }
    }

    return NextResponse.json({ 
      status: '✅ ADMITAD (XML): Feed REAL sincronizado com sucesso!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA API DA ADMITAD (XML):", error);
    return NextResponse.json({ 
      error: "Falha na sincronização da Admitad", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}