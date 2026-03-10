import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Função auxiliar para criar a URL amigável
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
    // 1. Chaves da Nova API (Adicione no seu arquivo .env.local depois)
    const SHOPEE_APP_ID = process.env.SHOPEE_APP_ID;
    const SHOPEE_SECRET = process.env.SHOPEE_SECRET;
    
    /* DESCOMENTE ESTA TRAVA DE SEGURANÇA QUANDO TIVER AS CHAVES
      if (!SHOPEE_APP_ID || !SHOPEE_SECRET) {
        return NextResponse.json({ error: "Faltam as chaves da Shopee no .env.local" }, { status: 500 });
      }
    */

    // 2. A URL da API do seu novo parceiro
    // Substitua pela URL real da documentação do parceiro (Ex: Amazon, AliExpress, Shopee)
    const API_URL = "https://api.exemplo-parceiro.com.br/v1/ofertas";
    
    // SIMULAÇÃO DE RESPOSTA DA API (Para você testar agora mesmo sem ter a chave oficial)
    const mockApiResponse = {
      items: [
        {
          id_externo: "SHP998877",
          nome_produto: "Fone de Ouvido Bluetooth Sem Fio TWS - Bateria 24h",
          descricao_html: "<p>O melhor fone custo-benefício. <strong>Cancelamento de ruído</strong> e graves profundos.</p>",
          valor_atual: 45.90,
          valor_antigo: 120.00,
          nome_loja: "Shopee Oficial",
          foto_capa: "https://placehold.co/800x800/ff5722/ffffff?text=Fone+Shopee",
          link_afiliado: "https://shopee.com.br/m/ofertas",
          cupom_desconto: "FONE15"
        },
        {
          id_externo: "SHP554433",
          nome_produto: "Smartwatch Relógio Inteligente Esportivo Pro Max",
          descricao_html: "<p>Monitore sua saúde, batimentos e passos com precisão.</p><ul><li>À prova d'água</li><li>Tela AMOLED</li></ul>",
          valor_atual: 89.99,
          valor_antigo: 250.00,
          nome_loja: "Shopee Tech",
          foto_capa: "https://placehold.co/800x800/ff5722/ffffff?text=Smartwatch",
          link_afiliado: "https://shopee.com.br/m/ofertas",
          cupom_desconto: "" // Sem cupom
        }
      ]
    };

    const productsList = mockApiResponse.items || []; 

    if (productsList.length === 0) {
      return NextResponse.json({ message: "Sincronização OK, mas nenhum produto retornado." });
    }

    let importedCount = 0;

    // 3. O LOOP TRADUTOR: Pega os dados bagunçados e formata para o padrão Baratinho
    for (const product of productsList) {
      const productId = String(product.id_externo);

      // Verifica se a oferta já existe no nosso banco de dados
      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", productId)
        .limit(1)
        .get();

      // Se não existir, salva no Firebase traduzindo os campos
      if (querySnapshot.empty) {
        const slug = generateSlug(product.nome_produto);

        await adminDb.collection("ofertas").add({
          titulo: product.nome_produto,
          descricao: product.descricao_html || "",
          preco: product.valor_atual,
          precoAntigo: product.valor_antigo,
          loja: product.nome_loja,
          imagemUrl: product.foto_capa,
          urlAfiliado: product.link_afiliado,
          externalId: productId,
          slug: slug,
          categoria: "Ofertas", // Você pode tentar mapear a categoria real se a API fornecer
          cupom: product.cupom_desconto || null, // Se tiver cupom, o front-end já vai mostrar automaticamente!
          dataCriacao: new Date(),
          hot: true 
        });
        
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: '✅ PARCEIRO 2: Integração concluída com sucesso!', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO NA INTEGRAÇÃO 2:", error);
    return NextResponse.json({ 
      error: "Falha na sincronização do novo parceiro", 
      detalhe: error.message || String(error) 
    }, { status: 500 });
  }
}