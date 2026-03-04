import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    // 1. Buscar produtos em oferta no Mercado Livre
    // MLB = Brasil | q = termo de busca
    const response = await fetch('https://api.mercadolibre.com/sites/MLB/search?q=oferta-do-dia&limit=10');
    const data = await response.json();

    const results = data.results;
    let count = 0;

    for (const item of results) {
      // 2. Evitar duplicados (checa se o ID do ML já existe)
      const q = query(collection(db, "ofertas"), where("externalId", "==", item.id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 3. Salvar no Firebase com o seu link de afiliado
        // DICA: Você deve trocar o item.permalink pelo seu link gerado no portal de afiliados
        await addDoc(collection(db, "ofertas"), {
          titulo: item.title,
          preco: item.price,
          precoAntigo: item.original_price || item.price * 1.2, // Simulação caso não venha
          loja: "Mercado Livre",
          imagemUrl: item.thumbnail.replace("-I.jpg", "-O.jpg"), // Melhora a qualidade da imagem
          urlAfiliado: item.permalink, // Link original
          externalId: item.id,
          dataCriacao: serverTimestamp(),
          categoria: "Eletrônicos"
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, imported: count });
  } catch (error) {
    return NextResponse.json({ error: "Falha na sincronização" }, { status: 500 });
  }
}