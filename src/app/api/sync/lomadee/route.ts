import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// AS TRÊS LINHAS MÁGICAS QUE DESLIGAM O CACHE DA VERCEL E DO NEXT.JS
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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

    // LISTA EXPANDIDA COM OS PRODUTOS DE MAIOR CONVERSÃO NO BRASIL
    const categorias = [
      "tv", 
      "notebook", 
      "geladeira", 
      "iphone", 
      "monitor", 
      "ar condicionado",
      "air fryer",
      "playstation",
      "xbox",
      "nintendo switch",
      "smartphone",
      "fone bluetooth",
      "caixa de som jbl",
      "micro-ondas",
      "maquina de lavar",
      "aspirador robo",
      "cafeteira",
      "ventilador",
      "whey protein",
      "fralda",
      "pneu",
      "kindle",
      "tablet",
      "smartwatch",
      "pc gamer"
    ];

    // Sorteia uma categoria da lista
    const categoriaSorteada = categorias[Math.floor(Math.random() * categorias.length)];
    const buscaFormatada = encodeURIComponent(categoriaSorteada);
    
    // Formata o nome para o banco de dados (Ex: "air fryer" vira "Air fryer")
    const categoriaParaBanco = categoriaSorteada.charAt(0).toUpperCase() + categoriaSorteada.slice(1);

    const API_URL = `https://api-beta.lomadee.com.br/affiliate/products?limit=20&search=${buscaFormatada}`;
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': LOMADEE_TOKEN
      },
      cache: 'no-store', // <--- AQUI ESTÁ A GARANTIA DE DADOS FRESCOS
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`A API recusou a conexão. Código HTTP: ${response.status}`);
    }

    const jsonResponse = await response.json();
    const productsList = jsonResponse.data || []; 

    if (productsList.length === 0) {
      return NextResponse.json({ message: `Sincronização OK, mas nenhum produto retornado para: ${categoriaSorteada}` });
    }

    let importedCount = 0;

    for (const product of productsList) {
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
          descricao: product.description || "", // AQUI ESTÁ A MÁGICA DA DESCRIÇÃO!
          preco: precoReal,
          precoAntigo: precoAntigo,
          loja: lojaNome,
          imagemUrl: primeiraImagem,
          urlAfiliado: product.url,
          externalId: productId,
          slug: slug,
          categoria: categoriaParaBanco, // Agora a categoria entra dinâmica!
          dataCriacao: new Date(),
          hot: true 
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: `✅ DADOS REAIS: Sincronização da categoria '${categoriaSorteada}' concluída!`, 
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