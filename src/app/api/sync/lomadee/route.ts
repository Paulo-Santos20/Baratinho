import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Produtos simulados de alta qualidade para não travar o seu desenvolvimento
const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Smartphone Samsung Galaxy S23 Ultra 256GB 5G",
    price: 5299.00,
    store: { name: "Magalu" },
    thumbnail: "https://images-americanas.b2w.io/produtos/7483861877/imagens/smartphone-samsung-galaxy-s23-ultra-5g-256gb-tela-6-8-12gb-ram-camera-quadrupla-de-ate-200mp-e-selfie-12mp-preto/7483861877_1_large.jpg",
    link: "https://www.socialsoul.com.vc/"
  },
  {
    id: "mock-2",
    name: "Console PlayStation 5 + EA SPORTS FC 24",
    price: 4199.90,
    store: { name: "Amazon" },
    thumbnail: "https://m.media-amazon.com/images/I/61rPEB17QvL._AC_SX679_.jpg",
    link: "https://www.socialsoul.com.vc/"
  },
  {
    id: "mock-3",
    name: "Monitor Gamer LG UltraGear 27'' 144Hz IPS",
    price: 1349.00,
    store: { name: "Kabum" },
    thumbnail: "https://images.kabum.com.br/produtos/fotos/444038/monitor-gamer-lg-ultragear-27-144hz-1ms-ips-hdmi-e-displayport-hdr-10-99-srgb-freesync-premium-vesa-27gn65r-b_1684762883_gg.jpg",
    link: "https://www.socialsoul.com.vc/"
  }
];

export async function GET(request: Request) {
  try {
    const LOMADEE_TOKEN = process.env.LOMADEE_TOKEN;
    const SOURCE_ID = process.env.LOMADEE_SOURCE_ID;
    
    if (!LOMADEE_TOKEN || !SOURCE_ID) {
      return NextResponse.json({ error: "Faltam chaves no .env.local" }, { status: 500 });
    }

    // Como a URL antiga caiu, tentaremos buscar. Se falhar, usaremos os dados falsos.
    const url = `https://api.lomadee.com/v2/${LOMADEE_TOKEN}/offer/_search?sourceId=${SOURCE_ID}&keyword=tecnologia&sort=relevance`;
    let offersData = [];

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) }); // Timeout de 5s para não travar
      const data = await response.json();
      if (data.offers) offersData = data.offers;
    } catch (fetchError) {
      console.warn("⚠️ API da Lomadee/SocialSoul fora do ar. Usando dados de teste (Mock).");
      offersData = MOCK_PRODUCTS; // Ativa o plano B!
    }

    if (offersData.length === 0) return NextResponse.json({ message: "Sem novas ofertas." });

    let importedCount = 0;

    for (const offer of offersData) {
      const querySnapshot = await adminDb.collection("ofertas")
        .where("externalId", "==", offer.id)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        const slug = offer.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

        await adminDb.collection("ofertas").add({
          titulo: offer.name,
          preco: offer.price,
          precoAntigo: offer.price * 1.15,
          loja: offer.store.name,
          imagemUrl: offer.thumbnail,
          urlAfiliado: offer.link,
          externalId: offer.id,
          slug: slug,
          categoria: "Tecnologia",
          dataCriacao: new Date(),
          hot: offer.price < (offer.price * 0.9)
        });
        importedCount++;
      }
    }

    return NextResponse.json({ 
      status: '✅ Sincronização concluída (com suporte a Mock)', 
      novosProdutos: importedCount 
    });

  } catch (error: any) {
    console.error("🔥 ERRO DETALHADO NO TERMINAL:", error);
    return NextResponse.json({ error: "Falha na automação", detalhe: String(error) }, { status: 500 });
  }
}