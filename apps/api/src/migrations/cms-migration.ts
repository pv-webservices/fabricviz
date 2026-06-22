import { Pool } from 'pg';

export async function runCmsMigrations(db: Pool) {
  console.log('Running CMS Migration (Homepage)...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS homepage_content (
      id SERIAL PRIMARY KEY,
      section_name VARCHAR(255) UNIQUE NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if empty
  const res = await db.query('SELECT COUNT(*) FROM homepage_content');
  if (parseInt(res.rows[0].count, 10) === 0) {
    console.log('Seeding homepage_content with default data...');

    // Header
    await db.query(
      `INSERT INTO homepage_content (section_name, data) VALUES ($1, $2)`,
      ['header', JSON.stringify({
        logo_text: "FABRICVIZ",
        logo_image_url: null,
        menu_items: [
          { id: "1", label: "HOME", link: "/", visible: true, order: 0 },
          { id: "2", label: "SOFA", link: "/sofa", visible: true, order: 1 },
          { id: "3", label: "CURTAIN", link: "/curtain", visible: true, order: 2 },
          { id: "4", label: "CONTACT", link: "/contact", visible: true, order: 3 }
        ]
      })]
    );

    // Hero Banners
    await db.query(
      `INSERT INTO homepage_content (section_name, data) VALUES ($1, $2)`,
      ['hero_banners', JSON.stringify({
        banners: [
          {
            id: "1",
            image_url: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=2070&auto=format&fit=crop",
            headline: "Texture That Speaks",
            subtext: "Premium curtain & sofa fabrics for designers, architects & retailers.",
            cta1_text: "Launch App \u2192",
            cta1_link: "/login",
            cta2_text: "Request Samples",
            cta2_link: "/login",
            active: true,
            order: 0
          },
          {
            id: "2",
            image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop",
            headline: "Light. Air. Elegance.",
            subtext: "Sheer perfection to transform your natural light boundaries.",
            cta1_text: "Launch App \u2192",
            cta1_link: "/login",
            cta2_text: "Request Samples",
            cta2_link: "/login",
            active: true,
            order: 1
          },
          {
            id: "3",
            image_url: "https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=2070&auto=format&fit=crop",
            headline: "Wholesale Craftsmanship",
            subtext: "Rich jacquards and brocades sourced directly from the finest mills.",
            cta1_text: "Launch App \u2192",
            cta1_link: "/login",
            cta2_text: "Request Samples",
            cta2_link: "/login",
            active: true,
            order: 2
          },
          {
            id: "4",
            image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop",
            headline: "Design Without Compromise",
            subtext: "Curated layers of modern drapery for the sophisticated interior.",
            cta1_text: "Launch App \u2192",
            cta1_link: "/login",
            cta2_text: "Request Samples",
            cta2_link: "/login",
            active: true,
            order: 3
          }
        ],
        running_bar_text: "Velvet, Chenille, Jacquard, Linen, Silk, Sheer, Blackout, Performance, Faux Leather, Suede, Brocade"
      })]
    );

    // Stats Bar
    await db.query(
      `INSERT INTO homepage_content (section_name, data) VALUES ($1, $2)`,
      ['stats_bar', JSON.stringify({
        stats: [
          { id: "1", icon: "Leaf", title: "OEKO-TEX Certified", subtitle: "THE SAFE CHOICE", active: true, order: 0 },
          { id: "2", icon: "Factory", title: "Direct from Mill", subtitle: "SINCE 2005", active: true, order: 1 },
          { id: "3", icon: "PawPrint", title: "Stain Guard Technology", subtitle: "PET & KID FRIENDLY", active: true, order: 2 },
          { id: "4", icon: "Package", title: "Pan-India Delivery", subtitle: "FREE ABOVE \u20B925,000", active: true, order: 3 }
        ]
      })]
    );

    // Masonry Grid
    await db.query(
      `INSERT INTO homepage_content (section_name, data) VALUES ($1, $2)`,
      ['masonry_grid', JSON.stringify({
        tag_label: "Our Categories",
        section_title: "Product Collections",
        subheading: "\"Life should be Chic, Glamorous and Colourful \u2014 and so should your home!\"",
        items: [
          { id: "1", type: "image", src: "https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=800&auto=format&fit=crop", alt: "Outdoor shade sail", span_preset: "wide", order: 0, active: true },
          { id: "2", type: "image", src: "https://images.unsplash.com/photo-1541123437800-1c0c05a10408?q=80&w=800&auto=format&fit=crop", alt: "Bedroom sheer drapes", span_preset: "tall", order: 1, active: true },
          { id: "3", type: "image", src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop", alt: "Roller blind", span_preset: "tall", order: 2, active: true },
          { id: "4", type: "text", title: "Fabrics, Blinds, Panels & Tracks:", subtitle: "Your One Stop Shop for All Things Fabric", bg: "slate", order: 3, active: true },
          { id: "5", type: "image", src: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?q=80&w=800&auto=format&fit=crop", alt: "Velvet sofa close-up", span_preset: "1x1", order: 4, active: true },
          { id: "6", type: "image", src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop", alt: "Paneled wall interior", span_preset: "tall", order: 5, active: true },
          { id: "7", type: "text", title: "Live Better:", subtitle: "Experience Premium Fabrics \u2014 Upholstery, Outdoor & Curtain Solutions", bg: "brand-alt", order: 6, active: true },
          { id: "8", type: "image", src: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop", alt: "Velvet texture corner", span_preset: "1x1", order: 7, active: true },
          { id: "9", type: "image", src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop", alt: "Cozy throw and rug", span_preset: "wide", order: 8, active: true }
        ]
      })]
    );

    // Home Textiles Carousel
    await db.query(
      `INSERT INTO homepage_content (section_name, data) VALUES ($1, $2)`,
      ['textiles_carousel', JSON.stringify({
        tag_label: "Home Textiles",
        section_title: "Our Collection",
        subtitle: "From upholstery fabrics to wall hangings, explore our full collections and see where your creativity takes you.",
        cards: [
          { id: "1", image_url: "https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=800&auto=format&fit=crop", name: "Outdoor Performance", code: "All-Weather Durability", link: "#", active: true, order: 0 },
          { id: "2", image_url: "https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?q=80&w=800&auto=format&fit=crop", name: "Plush Velvet Upholstery", code: "Indoor Luxury Textures", link: "#", active: true, order: 1 },
          { id: "3", image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop", name: "Linen Curtains & Drapery", code: "Light Filtering & Sheers", link: "#", active: true, order: 2 },
          { id: "4", image_url: "https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=800&auto=format&fit=crop", name: "Heavy Jacquards", code: "Statement Woven Patterns", link: "#", active: true, order: 3 },
          { id: "5", image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop", name: "Sun-blocking Blackout", code: "Thermal Window Treatments", link: "#", active: true, order: 4 }
        ]
      })]
    );

    console.log('Homepage CMS seeded successfully.');
  }
}
