import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Função para URL amigável (SEO)
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
    // Agora só precisamos do Token, que atuará como x-api-key
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
    
    if (!LOMADEE_TOKEN) {
      return NextResponse.json({ error: "Falta o LOMADEE_TOKEN no .env.local" }, { status: 500 });
    }

    // A URL oficial da documentação com busca por 'smartphone' e limite de 20 produtos
    const API_URL = "https://api-beta.lomadee.com.br/affiliate/products?limit=20";
    
    // Conexão com a nova API
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': LOMADEE_TOKEN // Cabeçalho exato exigido pela documentação
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`A API recusou a conexão. Código HTTP: ${response.status}`);
    }

    const jsonResponse = await response.json();
    
    // A documentação mostra que os produtos vêm dentro de um array chamado "data"
    const productsList = jsonResponse.data || []; 

    if (productsList.length === 0) {
      return NextResponse.json({ message: "Sincronização OK, mas nenhum produto retornado." });
    }

    let importedCount = 0;

    for (const product of productsList) {
      // Usa o _id ou id oficial do produto
      const productId = String(product._id || product.id);

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const slug = generateSlug(product.name);
        
        // Mapeamento Cirúrgico da Nova API
        const primeiraImagem = product.images?.[0]?.url || "";
        const primeiraOpcao = product.options?.[0]; // Pega a primeira variante de preço/loja
        const lojaNome = primeiraOpcao?.seller || "Loja Parceira";
        
        // Extrai o preço real (pode vir como listPrice ou price)
        const precoReal = primeiraOpcao?.pricing?.[0]?.price || 0;
        const precoAntigo = primeiraOpcao?.pricing?.[0]?.listPrice || (precoReal * 1.2);

        await adminDb.collection("ofertas").add({
          titulo: product.name,
          preco: precoReal,
          precoAntigo: precoAntigo,
          loja: lojaNome,
          imagemUrl: primeiraImagem,
          urlAfiliado: product.url,
          externalId: productId,
          slug: slug,
          categoria: "Smartphones", // Como filtramos por 'smartphone' na URL
          dataCriacao: new Date(),
          hot: true // Marca como oferta quente
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: '✅ DADOS REAIS: Sincronização Beta da Lomadee concluída!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA NOVA API:", error);
    return NextResponse.json({ 
      error: "Falha na automação real", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}