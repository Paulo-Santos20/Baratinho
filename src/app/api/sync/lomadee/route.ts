import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// TRAVAS ANTI-CACHE (Performance Total)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
// Dá mais tempo para o servidor fazer as buscas múltiplas
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
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
    
    if (!LOMADEE_TOKEN) {
      return NextResponse.json({ error: "Falta o LOMADEE_TOKEN no .env.local" }, { status: 500 });
    }

    const categorias = [
      "tv", "notebook", "geladeira", "iphone", "monitor", "ar condicionado",
      "air fryer", "playstation", "xbox", "smartphone", "fone bluetooth",
      "caixa de som jbl", "micro-ondas", "maquina de lavar", "cafeteira",
      "ventilador", "whey protein", "fralda", "pneu", "tablet", "smartwatch"
    ];

    // MÁGICA: Embaralha a lista e pega 3 categorias totalmente aleatórias
    const categoriasEmbaralhadas = categorias.sort(() => 0.5 - Math.random());
    const categoriasEscolhidas = categoriasEmbaralhadas.slice(0, 3);

    // Dispara as 3 buscas ao MESMO TEMPO (Processamento Paralelo)
    const fetchPromises = categoriasEscolhidas.map(async (categoria) => {
      const buscaFormatada = encodeURIComponent(categoria);
      // Pega os 6 produtos mais relevantes (e novos) de cada categoria
      const url = `https://api-beta.lomadee.com.br/affiliate/products?limit=6&search=${buscaFormatada}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'x-api-key': LOMADEE_TOKEN },
        cache: 'no-store',
      });

      if (!res.ok) return [];
      const json = await res.json();
      
      // Anexa o nome da categoria que encontrou o produto para salvarmos no banco
      return (json.data || []).map((prod: any) => ({ 
        ...prod, 
        categoriaSorteada: categoria.charAt(0).toUpperCase() + categoria.slice(1) 
      }));
    });

    // Aguarda todas as buscas terminarem e junta tudo numa lista só
    const resultados = await Promise.all(fetchPromises);
    const todosProdutos = resultados.flat();

    if (todosProdutos.length === 0) {
      return NextResponse.json({ message: "Nenhum produto encontrado nas categorias sorteadas." });
    }

    let importedCount = 0;

    for (const product of todosProdutos) {
      const productId = String(product._id || product.id);

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const slug = generateSlug(product.name);
        
        const primeiraImagem = product.images?.[0]?.url || "";
        const primeiraOpcao = product.options?.[0];
        const lojaNome = primeiraOpcao?.seller || "Loja Parceira";
        const precoReal = primeiraOpcao?.pricing?.[0]?.price || 0;
        const precoAntigo = primeiraOpcao?.pricing?.[0]?.listPrice || (precoReal * 1.2);

        await adminDb.collection("ofertas").add({
          titulo: product.name,
          descricao: product.description || "",
          preco: precoReal,
          precoAntigo: precoAntigo,
          loja: lojaNome,
          imagemUrl: primeiraImagem,
          urlAfiliado: product.url,
          externalId: productId,
          slug: slug,
          categoria: product.categoriaSorteada, // Salva a categoria correta
          dataCriacao: new Date(),
          hot: true 
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: `✅ MISTURA PERFEITA: Buscou ${categoriasEscolhidas.join(', ')}!`, 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA API:", error);
    return NextResponse.json({ error: "Falha na sincronização", detalhe: error.message }, { status: 500 });
  }
}