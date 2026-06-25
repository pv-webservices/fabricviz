const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

const data = {
  tag_label: "WHAT CLIENTS SAY",
  heading: "Trusted by Interior Designers Worldwide",
  subheading: "From bespoke upholstery to custom drapery — here is what our clients say.",
  cta_text: "VIEW ALL COLLECTIONS →",
  cta_link: "/collections/all",
  testimonials: [
    {
      id: "t1",
      author_photo_url: null,
      author_name: "Priya Mehta",
      author_role: "Lead Interior Designer",
      author_company: "Studio Verde, Mumbai",
      quote: "The FabricViz visualizer completely transformed the way I present fabric options to clients. They can immediately see how the Velvet collection drapes on their sofa. It closed our deals 50% faster.",
      rating: 5
    },
    {
      id: "t2",
      author_photo_url: null,
      author_name: "Eleanor Richards",
      author_role: "Principal Architect",
      author_company: "Richards & Co, London",
      quote: "Finally, a platform that understands textile nuances. The way the sheer curtains render the light transmission is breathtaking. A must-have tool for any serious designer.",
      rating: 5
    },
    {
      id: "t3",
      author_photo_url: null,
      author_name: "Marcus Chen",
      author_role: "Director of Procurement",
      author_company: "Luxe Hospitality, Singapore",
      quote: "We sourced our entire 2025 hotel refresh through their wholesale catalog. Being able to visualize the high-martindale fabrics in our exact room configurations saved us weeks of sampling.",
      rating: 4
    },
    {
      id: "t4",
      author_photo_url: null,
      author_name: "Sarah Jenkins",
      author_role: "Homeowner",
      author_company: "",
      quote: "I was hesitant to order custom upholstery online, but uploading a picture of my living room and seeing the exact pattern matched to my sofa gave me total confidence.",
      rating: 5
    }
  ]
};

async function seed() {
  await client.connect();
  try {
    await client.query(`
      INSERT INTO homepage_content (section_name, data) 
      VALUES ($1, $2)
      ON CONFLICT (section_name) 
      DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
    `, ['testimonials_section', JSON.stringify(data)]);
    console.log('Seeded testimonials_section successfully');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
seed();
