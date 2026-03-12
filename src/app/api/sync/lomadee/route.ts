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

    console.log(`🚀 Iniciando busca geral (Últimos adicionados na Lomadee)...`);

    // ==========================================
    // 🎣 O NOVO MOTOR DE BUSCA GERAL
    // ==========================================
    // Removemos a pesquisa específica (search) e pedimos um lote grande (limit=50)
    // Se a Lomadee suportar o parâmetro de ordenação (ex: sort=date), ele puxará os mais novos.
    const url = `https://api-beta.lomadee.com.br/affiliate/products?limit=50`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'x-api-key': LOMADEE_TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error(`❌ Erro na API da Lomadee: Status ${res.status}`);
      return NextResponse.json({ error: "Erro de comunicação com a Lomadee", status: res.status }, { status: 500 });
    }
    
    const json = await res.json();
    
    const arrayDeProdutos = json.data || json.products || json.items || (Array.isArray(json) ? json : []);

    if (arrayDeProdutos.length === 0) {
      console.log("⚠️ Nenhum produto retornado pela Lomadee na busca geral.");
      return NextResponse.json({ message: "A API da Lomadee não retornou produtos válidos agora." });
    }

    let importedCount = 0;
    let ignoredCount = 0;
    let alreadyExistsCount = 0;

    for (const product of arrayDeProdutos) {
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

      if (!querySnapshot.empty) {
        alreadyExistsCount++;
        continue;
      }

      const nomeProduto = product.name || product.title || "Produto sem nome";
      const slug = generateSlug(nomeProduto);
      
      const primeiraImagem = product.thumbnail || product.image || product.images?.[0]?.url || product.images?.[0] || "";
      const linkAfiliado = product.link || product.url || product.affiliateUrl || "";
      const lojaNome = product.store?.name || product.seller || product.options?.[0]?.seller || "Loja Parceira";
      
      const precoReal = Number(product.price || product.salePrice || product.priceMin || product.options?.[0]?.pricing?.[0]?.price || 0);
      const precoAntigo = Number(product.originalPrice || product.listPrice || product.options?.[0]?.pricing?.[0]?.listPrice || (precoReal > 0 ? precoReal * 1.2 : 0));

      // MÁGICA DE CATEGORIA: Tenta ler a categoria que a Lomadee enviou, senão joga em "Ofertas"
      const categoriaReal = product.category?.name || product.category || "Ofertas";

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
          categoria: categoriaReal,
          dataCriacao: new Date(),
          hot: true,
          likes: [], 
          comentarios: 0
        });
        importedCount++;
      } else {
        ignoredCount++;
      }
    }

    return NextResponse.json({ 
      status: `✅ ARRASTÃO CONCLUÍDO!`, 
      novosProdutosSalvos: importedCount,
      produtosJaNoBanco: alreadyExistsCount,
      produtosIgnoradosOuEsgotados: ignoredCount,
      totalProcessado: arrayDeProdutos.length
    });

  } catch (error: any) {
    console.error("🔥 ERRO FATAL NA API:", error);
    return NextResponse.json({ error: "Falha na sincronização", detalhe: error.message }, { status: 500 });
  }
}