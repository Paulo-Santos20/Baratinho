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

    console.log(`🚀 Iniciando busca para: ${categoriasEscolhidas.join(', ')}`);

    // Dispara as 3 buscas ao MESMO TEMPO (Processamento Paralelo)
    const fetchPromises = categoriasEscolhidas.map(async (categoria) => {
      try {
        const buscaFormatada = encodeURIComponent(categoria);
        const url = `https://api-beta.lomadee.com.br/affiliate/products?limit=6&search=${buscaFormatada}`;
        
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'x-api-key': LOMADEE_TOKEN },
          cache: 'no-store',
        });

        if (!res.ok) {
          console.error(`❌ Erro na API para "${categoria}": Status ${res.status}`);
          return [];
        }
        
        const json = await res.json();
        
        // ==========================================
        // 🚨 MODO RAIO-X LIGADO
        // ==========================================
        console.log(`\n=== RAIO-X LOMADEE: ${categoria} ===`);
        // Imprime apenas os primeiros 300 caracteres para não travar os logs, mas o suficiente para vermos a estrutura
        console.log(JSON.stringify(json).substring(0, 300) + '...'); 
        
        // CAÇADOR INTELIGENTE: Procura onde está a array de produtos independente do nome que a API der
        const arrayDeProdutos = json.data || json.products || json.items || (Array.isArray(json) ? json : []);

        // Anexa o nome da categoria que encontrou o produto para salvarmos no banco
        return arrayDeProdutos.map((prod: any) => ({ 
          ...prod, 
          categoriaSorteada: categoria.charAt(0).toUpperCase() + categoria.slice(1) 
        }));

      } catch (err) {
        console.error(`❌ Falha ao processar categoria "${categoria}":`, err);
        return []; // Retorna vazio mas não quebra as outras categorias
      }
    });

    // Aguarda todas as buscas terminarem e junta tudo numa lista só
    const resultados = await Promise.all(fetchPromises);
    const todosProdutos = resultados.flat();

    if (todosProdutos.length === 0) {
      console.log("⚠️ Nenhum produto retornado pela Lomadee.");
      return NextResponse.json({ message: "A API da Lomadee não retornou produtos válidos agora.", raioX: "Verifique os logs da Vercel" });
    }

    let importedCount = 0;

    for (const product of todosProdutos) {
      // Garante que pega o ID não importa como a Lomadee mande
      const productId = String(product._id || product.id || product.productId);
      
      if (!productId || productId === 'undefined') continue; // Pula se vier lixo da API

      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        // Fallbacks seguros para caso a estrutura mude
        const nomeProduto = product.name || product.title || "Produto sem nome";
        const slug = generateSlug(nomeProduto);
        
        const primeiraImagem = product.images?.[0]?.url || product.thumbnail || product.image || "";
        const primeiraOpcao = product.options?.[0];
        const lojaNome = primeiraOpcao?.seller || product.store?.name || "Loja Parceira";
        const precoReal = primeiraOpcao?.pricing?.[0]?.price || product.price || 0;
        const precoAntigo = primeiraOpcao?.pricing?.[0]?.listPrice || product.originalPrice || (precoReal > 0 ? precoReal * 1.2 : 0);
        const linkAfiliado = product.url || product.link || "";

        if (precoReal > 0) {
          await adminDb.collection("ofertas").add({
            titulo: nomeProduto,
            descricao: product.description || "",
            preco: precoReal,
            precoAntigo: precoAntigo,
            loja: lojaNome,
            imagemUrl: primeiraImagem,
            urlAfiliado: linkAfiliado, // Aqui entra o seu link monetizado
            externalId: productId,
            slug: slug,
            categoria: product.categoriaSorteada,
            dataCriacao: new Date(),
            hot: true,
            likes: [], // Inicia a array de likes vazia para evitar erro na página de perfil
            comentarios: 0
          });
          importedCount++;
        }
      }
    }

    return NextResponse.json({ 
      status: `✅ MISTURA PERFEITA: Buscou ${categoriasEscolhidas.join(', ')}!`, 
      novosProdutos: importedCount,
      totalProcessado: todosProdutos.length
    });

  } catch (error: any) {
    console.error("🔥 ERRO FATAL NA API:", error);
    return NextResponse.json({ error: "Falha na sincronização", detalhe: error.message }, { status: 500 });
  }
}