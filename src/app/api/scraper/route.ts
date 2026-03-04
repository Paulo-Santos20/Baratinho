import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export async function POST(req: Request) {
  const { url } = await req.json();

  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
    });
    const $ = cheerio.load(data);

    // Extração de metadados padrão (Open Graph)
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const image = $('meta[property="og:image"]').attr('content');
    
    // Lógica simples para tentar achar o preço (pode variar por site)
    // Muitos sites usam ld+json para dados estruturados
    let price = "";
    const jsonLd = $('script[type="application/ld+json"]');
    jsonLd.each((_, el) => {
      const content = JSON.parse($(el).html() || '{}');
      if (content.offers?.price) price = content.offers.price;
      if (content.mainEntity?.offers?.price) price = content.mainEntity.offers.price;
    });

    return NextResponse.json({
      titulo: title?.trim(),
      imagemUrl: image,
      preco: price || "0",
      loja: url.includes('amazon') ? 'Amazon' : url.includes('magalu') ? 'Magalu' : 'Loja Desconhecida'
    });
  } catch (error) {
    return NextResponse.json({ error: "Não foi possível importar os dados" }, { status: 500 });
  }
}