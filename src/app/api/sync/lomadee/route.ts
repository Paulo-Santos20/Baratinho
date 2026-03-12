import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
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

    const categoriasEmbaralhadas = categorias.sort(() => 0.5 - Math.random());
    const categoriasEscolhidas = categoriasEmbaralhadas.slice(0, 3);

    console.log(`🚀 Iniciando busca para: ${categoriasEscolhidas.join(', ')}`);

    const fetchPromises = categoriasEscolhidas.map(async (categoria) => {
      try {
        const buscaFormatada = encodeURIComponent(categoria);
        const url = `https://api-beta.lomadee.com.br/affiliate/products?limit=6&search=${buscaFormatada}`;
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'x-api-key': LOMADEE_TOKEN },
          cache: 'no-store',
        });

        if (!res.ok) return [];
        const json = await res.json();
        
        const arrayDeProdutos = json.data || json.products || json.items || (Array.isArray(json) ? json : []);

        return arrayDeProdutos.map((prod: any) => ({ 
          ...prod, 
          categoriaSorteada: categoria.charAt(0).toUpperCase() + categoria.slice(1) 
        }));

      } catch (err) {
        console.error(`❌ Falha ao processar categoria "${categoria}":`, err);
        return [];
      }
    });

    const resultados = await Promise.all(fetchPromises);
    const todosProdutos = resultados.flat();

    if (todosProdutos.length === 0) {
      return NextResponse.json({ message: "Nenhum produto retornado pela API neste momento." });
    }

    let importedCount = 0;
    let ignoredCount = 0;

    for (const product of todosProdutos) {
      // 1. Pula produtos que a loja avisou que estão sem estoque
      if (product.available === false) {
        ignoredCount++;
        continue; 
      }

      const productId = String(product._id || product.id || product.productId);
      if (!productId || productId === 'undefined') continue;

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const nomeProduto = product.name || product.title || "Produto sem nome";
        const slug = generateSlug(nomeProduto);
        
        // EXTRATORES BLINDADOS: Vasculha todos os possíveis nomes de campos da Lomadee
        const primeiraImagem = product.thumbnail || product.image || product.images?.[0]?.url || product.images?.[0] || "";
        const linkAfiliado = product.link || product.url || product.affiliateUrl || "";
        const lojaNome = product.store?.name || product.seller || product.options?.[0]?.seller || "Loja Parceira";
        
        // Força a conversão do preço para Número
        const precoReal = Number(product.price || product.salePrice || product.priceMin || product.options?.[0]?.pricing?.[0]?.price || 0);
        const precoAntigo = Number(product.originalPrice || product.listPrice || product.options?.[0]?.pricing?.[0]?.listPrice || (precoReal > 0 ? precoReal * 1.2 : 0));

        // 2. Trava de Segurança: Só salva se tiver Preço e Link de afiliado
        if (precoReal > 0 && linkAfiliado !== "") {
          await adminDb.collection("ofertas").add({
            titulo: nomeProduto,
            descricao: product.description || "",
            preco: precoReal,
            precoAntigo: precoAntigo,
            loja: lojaNome,
            imagemUrl: primeiraImagem,
            urlAfiliado: linkAfiliado, 
            externalId: productId,
            slug: slug,
            categoria: product.categoriaSorteada,
            dataCriacao: new Date(),
            hot: true,
            likes: [], 
            comentarios: 0
          });
          importedCount++;
        } else {
          // Se falhar, avisa no log O QUE faltou (Preço ou Link)
          console.log(`⚠️ Ignorado [Faltou Preço ou Link]: ${nomeProduto} | Preço lido: ${precoReal} | Link lido: ${linkAfiliado ? 'OK' : 'Vazio'}`);
          ignoredCount++;
        }
      }
    }

    return NextResponse.json({ 
      status: `✅ MISTURA PERFEITA: Buscou ${categoriasEscolhidas.join(', ')}!`, 
      novosProdutosSalvos: importedCount,
      produtosIgnoradosOuEsgotados: ignoredCount,
      totalProcessado: todosProdutos.length
    });

  } catch (error: any) {
    console.error("🔥 ERRO FATAL NA API:", error);
    return NextResponse.json({ error: "Falha na sincronização", detalhe: error.message }, { status: 500 });
  }
}