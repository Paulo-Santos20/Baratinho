import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'URL inválida.' }, { status: 400 });
    }

    // Requisição blindada disfarçada de navegador real
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error('Falha ao acessar a página do produto.');

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extração base (Open Graph e Meta Tags)
    let titulo = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const imagemUrl = $('meta[property="og:image"]').attr('content') || $('#landingImage').attr('src') || $('meta[name="twitter:image"]').attr('content') || '';
    let descricao = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    
    // Identificação da Loja
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    let lojaFormatada = domain.replace('www.', '').split('.')[0];
    lojaFormatada = lojaFormatada.charAt(0).toUpperCase() + lojaFormatada.slice(1);

    let precoSugerido = 0;

    // LÓGICA ESPECÍFICA POR LOJA (Arquitetura Escalável)
    if (domain.includes('mercadolivre.com.br')) {
      lojaFormatada = 'Mercado Livre';
      titulo = titulo.replace(/- Mercado Livre$/, '').trim();
      const fraction = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().replace(/\./g, '');
      const cents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text() || '00';
      if (fraction) precoSugerido = parseFloat(`${fraction}.${cents}`);
      
    } else if (domain.includes('amazon.com.br') || domain.includes('amzn.to')) {
      lojaFormatada = 'Amazon';
      titulo = titulo.replace(/\| Amazon\.com\.br$/, '').trim();
      const whole = $('.a-price-whole').first().text().replace(/\./g, '').replace(/,/g, '');
      const fraction = $('.a-fraction').first().text() || '00';
      if (whole) precoSugerido = parseFloat(`${whole}.${fraction}`);
      
    } else {
      // TENTATIVA 1: Busca via Schema/JSON-LD (Padrão ouro de SEO para e-commerce)
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        try {
          const parsed = JSON.parse(jsonLd);
          const product = Array.isArray(parsed) ? parsed[0] : parsed;
          if (product?.offers?.price) {
            precoSugerido = parseFloat(product.offers.price);
          }
        } catch (e) { /* Ignora erro de JSON malformado da loja */ }
      }

      // TENTATIVA 2: Busca genérica por texto com Regex (Plano de contenção)
      if (precoSugerido === 0) {
        const priceMatch = html.match(/(?:R\$|BRL)\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
        if (priceMatch && priceMatch[1]) {
          precoSugerido = parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.'));
        }
      }
    }

    return NextResponse.json({
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      imagemUrl,
      loja: lojaFormatada,
      urlOriginal: url,
      precoSugerido
    });

  } catch (error: any) {
    console.error("Erro no Scraper:", error);
    return NextResponse.json({ error: 'Bloqueio da loja. Preencha os dados manualmente.' }, { status: 500 });
  }
}