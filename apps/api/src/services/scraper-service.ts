import * as cheerio from 'cheerio';

export interface ScrapedFabric {
  name: string;
  code: string;
  imageUrl?: string;
  colorFamily?: string;
  quality?: string;
  priceInr?: number;
  fabricWidthCm?: number;
  endUse: 'sofa' | 'curtain' | 'rug' | 'wallpaper' | 'both';
  tags: string[];
}

export async function scrapeShopaccinoUrl(url: string): Promise<ScrapedFabric[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const fabrics: ScrapedFabric[] = [];

    const productCards = $('.product-wrapper, .product-item, .item.product, .product-block, .grid-product');

    productCards.each((_, el) => {
      const titleText = $(el).find('.product-title, .product-name, .title a, .name').text().trim();
      let name = titleText;
      let code = '';
      
      if (titleText.includes('-')) {
        const parts = titleText.split('-');
        name = parts[0].trim();
        code = parts.slice(1).join('-').trim();
      } else {
        code = $(el).find('.sku, .product-sku').text().trim() || 'SKU-' + Math.floor(Math.random() * 100000);
      }

      let imageUrl = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
      if (imageUrl && !imageUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      const priceText = $(el).find('.price, .product-price, .money').text().replace(/[^0-9.]/g, '');
      const priceInr = priceText ? parseFloat(priceText) : 0;

      if (name) {
        fabrics.push({
          name,
          code,
          imageUrl,
          priceInr,
          endUse: 'sofa',
          colorFamily: '',
          quality: 'Standard',
          fabricWidthCm: 140,
          tags: [],
        });
      }
    });

    if (fabrics.length === 0) {
      $('img').each((_, el) => {
        const img = $(el);
        const src = img.attr('data-src') || img.attr('src');
        if (!src || src.toLowerCase().includes('logo') || src.toLowerCase().includes('icon') || src.toLowerCase().includes('banner')) return;
        
        const container = img.closest('a, .item, .product, li, .card, div[class*="col-"], div[class*="product"]');
        if (container.length > 0) {
          const textElement = container.find('h2, h3, h4, h5, .title, .name, [class*="title"], [class*="name"]').first();
          let title = textElement.text().trim();
          
          if (!title) {
              title = container.text().replace(/[\n\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();
              if (title.length > 60) title = title.substring(0, 60);
          }

          if (title && title.length > 2 && fabrics.length < 100) {
            let imageUrl = src;
            if (!imageUrl.startsWith('http')) {
              const urlObj = new URL(url);
              imageUrl = `${urlObj.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
            
            let name = title;
            let code = 'SKU-' + Math.floor(Math.random() * 100000);
            if (title.includes('-')) {
              const parts = title.split('-');
              name = parts[0].trim();
              code = parts.slice(1).join('-').trim() || code;
            }

            if (!fabrics.find(f => f.imageUrl === imageUrl || f.name === name)) {
                fabrics.push({
                  name,
                  code,
                  imageUrl,
                  priceInr: 0,
                  endUse: 'sofa',
                  colorFamily: '',
                  quality: 'Standard',
                  fabricWidthCm: 140,
                  tags: [],
                });
            }
          }
        }
      });
    }

    return fabrics;
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error('Failed to scrape the provided URL. Ensure it is accessible.');
  }
}
