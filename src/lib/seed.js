// src/lib/seed.js
// Comprehensive seed data for both MySQL and SQLite backends
import bcrypt from 'bcryptjs';
import { query, getDbType, initDatabase } from './db.js';

/**
 * Seed the database with dummy data.
 * Uses the unified query() function so it works with both MySQL and SQLite.
 */
export async function seedDatabase() {
  console.log('🌱 Seeding database with dummy data...');

  const dbType = getDbType();
  console.log(`  Using database backend: ${dbType}`);

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('  ✓ Passwords hashed');

  // === AUTHORS ===
  // Use individual queries for SQLite compatibility (no INSERT IGNORE)
  const authors = [
    {
      id: 1,
      slug: 'wanjiku-mwangi',
      name: 'Wanjiku Mwangi',
      bio: 'Wanjiku is a Nairobi-based architect and writer exploring the intersection of African design philosophy and modern urban planning. With over 12 years of experience in sustainable architecture across East Africa, she brings a unique perspective on how built environments shape cultural identity. Her work has been featured in Architectural Digest Africa and Dezeen.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 2,
      slug: 'otieno-kamau',
      name: 'Otieno Kamau',
      bio: 'Otieno is a visual artist and curator from Kisumu whose work explores identity, migration, and the African diaspora. His mixed-media installations have been exhibited at the Nairobi National Museum, the Zeitz MOCAA in Cape Town, and the Venice Biennale. He also mentors young artists through the Lake Victoria Arts Collective.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    {
      id: 3,
      slug: 'amina-hassan',
      name: 'Amina Hassan',
      bio: 'Amina is a cultural heritage researcher and storyteller from Lamu, Kenya. She specializes in documenting Swahili coastal traditions, oral histories, and indigenous knowledge systems. Her work bridges the gap between academic research and community engagement, ensuring that Kenya\'s rich cultural tapestry is preserved for future generations.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
    },
  ];

  for (const author of authors) {
    // Check if already exists
    const existing = await query('SELECT id FROM authors WHERE id = ? OR slug = ?', [author.id, author.slug]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO authors (id, slug, name, bio, avatar) VALUES (?, ?, ?, ?, ?)',
        [author.id, author.slug, author.name, author.bio, author.avatar]
      );
    }
  }
  console.log('  ✓ Authors seeded (3)');

  // === CATEGORIES ===
  const categories = [
    { id: 1, name: 'Architecture', slug: 'architecture', description: 'Exploring Kenya\'s built environment — from traditional Swahili architecture to cutting-edge sustainable design that shapes the cities of tomorrow.', is_active: 1 },
    { id: 2, name: 'Visual Arts', slug: 'visual-arts', description: 'Showcasing the vibrant world of Kenyan visual arts — paintings, sculptures, installations, digital art, and the creative minds behind them.', is_active: 1 },
    { id: 3, name: 'Cultural Heritage', slug: 'cultural-heritage', description: 'Preserving and celebrating Kenya\'s diverse cultural traditions, oral histories, indigenous knowledge, and the communities keeping heritage alive.', is_active: 1 },
    { id: 4, name: 'Design & Technology', slug: 'design-technology', description: 'Where creativity meets innovation — covering product design, digital tools, creative technology, and the future of Africa\'s design economy.', is_active: 1 },
    { id: 5, name: 'Creative Writing', slug: 'creative-writing', description: 'Poetry, prose, essays, and storytelling from Kenya\'s literary voices — exploring identity, place, and the human experience through words.', is_active: 1 },
  ];

  for (const cat of categories) {
    const existing = await query('SELECT id FROM categories WHERE id = ? OR slug = ?', [cat.id, cat.slug]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO categories (id, name, slug, description, is_active) VALUES (?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.slug, cat.description, cat.is_active]
      );
    }
  }
  console.log('  ✓ Categories seeded (5)');

  // === POSTS ===
  const posts = [
    {
      id: 1, slug: 'rediscovering-swahili-architecture-lamu',
      title: 'Rediscovering Swahili Architecture: The Living Heritage of Lamu',
      excerpt: 'A deep dive into the architectural wonders of Lamu Old Town, where centuries-old Swahili building traditions continue to inspire modern design across East Africa.',
      content: '<p>Lamu Old Town stands as one of the oldest and best-preserved Swahili settlements in East Africa, a UNESCO World Heritage Site that offers a window into centuries of architectural evolution. The narrow winding streets, carved wooden doors, and coral stone buildings tell stories of trade, culture, and craftsmanship that span generations.</p><p>Walking through Lamu is like stepping into a living museum. The buildings, many dating back to the 18th and 19th centuries, showcase a unique architectural style that blends African, Arab, Persian, and Indian influences. The iconic carved doors, known as "mganga," are masterpieces of Swahili craftsmanship — each one telling a story through its intricate geometric and floral patterns.</p><p>What makes Lamu\'s architecture truly remarkable is its sustainability. The coral stone walls naturally regulate temperature, keeping interiors cool in the tropical heat. The narrow streets create natural ventilation channels, and the inner courtyards provide private outdoor living spaces. These are lessons that modern architects are increasingly looking to as they design for a climate-conscious future.</p><p>Today, organizations like the Lamu Cultural Preservation Initiative are working to document these traditional building techniques and train a new generation of craftsmen. The goal isn\'t just preservation — it\'s adaptation, finding ways to incorporate these time-tested principles into contemporary Kenyan architecture.</p>',
      cover_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      featured_image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
      author_id: 1,
      author_snapshot: '{"name":"Wanjiku Mwangi","slug":"wanjiku-mwangi","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 1,
      category_ids: '[1, 3]',
      tags: '["architecture","swahili","heritage","lamu","sustainable-design"]',
      reading_time: 8, stats_views: 1520, stats_likes: 89, stats_comments: 12,
      published_at: '2025-05-15 09:00:00',
    },
    {
      id: 2, slug: 'digital-art-revolution-nairobi',
      title: 'The Digital Art Revolution Transforming Nairobi\'s Creative Scene',
      excerpt: 'How Kenyan digital artists are leveraging technology to create global art movements from the heart of East Africa.',
      content: '<p>Nairobi\'s creative landscape is undergoing a seismic shift. In studios across the city, from Kilimani to Kibera, a new generation of digital artists is redefining what it means to create art in Kenya. Armed with tablets, software, and an unshakeable creative vision, these artists are producing work that commands international attention.</p><p>The numbers tell a compelling story. The Kenyan creative economy, valued at over KES 500 billion annually, is one of the fastest-growing sectors in the country. Digital art, in particular, has seen explosive growth, fueled by increasing internet penetration, affordable digital tools, and a young, tech-savvy population.</p><p>Artists like Shiro Kiarie and Dennis Muraguri have pioneered a distinctly Kenyan digital aesthetic — one that draws on matatu culture, urban life, and traditional motifs while embracing the possibilities of digital media. Their work has been featured on NFT platforms, international galleries, and even corporate campaigns.</p><p>The revolution extends beyond individual artists. Collectives like Kuona Artists Trust and the Nairobi Art Centre are providing training, studio space, and exhibition opportunities for emerging digital creators. Meanwhile, online platforms are democratizing access to markets, allowing artists to sell directly to collectors worldwide.</p>',
      cover_image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      featured_image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
      author_id: 2,
      author_snapshot: '{"name":"Otieno Kamau","slug":"otieno-kamau","avatar":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 1,
      category_ids: '[2, 4]',
      tags: '["digital-art","nairobi","technology","creative-economy","nft"]',
      reading_time: 6, stats_views: 2340, stats_likes: 156, stats_comments: 23,
      published_at: '2025-06-01 14:30:00',
    },
    {
      id: 3, slug: 'kenyan-oral-traditions-digital-age',
      title: 'Preserving Kenya\'s Oral Traditions in the Digital Age',
      excerpt: 'From grandmother\'s stories to podcasts and apps — how technology is helping preserve Kenya\'s rich oral storytelling heritage for future generations.',
      content: '<p>For centuries, Kenya\'s diverse communities have passed down knowledge, history, and values through oral traditions. Stories told around fires, songs sung during ceremonies, and proverbs shared in daily conversation have been the primary vehicles for cultural transmission. But as urbanization accelerates and traditional community structures evolve, these precious oral traditions face the risk of being lost forever.</p><p>Now, a growing movement of technologists, linguists, and cultural practitioners are finding innovative ways to bridge this gap. Digital recording technologies, mobile apps, and online archives are being deployed to capture and preserve oral traditions before they disappear.</p><p>Projects like the African Oral Literature Archive at the University of Nairobi have digitized thousands of hours of recorded stories, songs, and oral histories from communities across Kenya. Meanwhile, mobile apps like Hadithi allow users to access traditional stories in multiple Kenyan languages, complete with translations and cultural context.</p><p>Perhaps most excitingly, young content creators are breathing new life into these traditions. Podcasts like "Stories from the Rift" and YouTube channels dedicated to African folklore are reaching audiences that traditional cultural institutions could never access. By combining ancient stories with modern storytelling formats, they\'re ensuring that Kenya\'s oral heritage remains vibrant and relevant.</p>',
      cover_image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800',
      featured_image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200',
      author_id: 3,
      author_snapshot: '{"name":"Amina Hassan","slug":"amina-hassan","avatar":"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[3, 5]',
      tags: '["oral-traditions","digital-preservation","culture","storytelling","heritage"]',
      reading_time: 7, stats_views: 890, stats_likes: 45, stats_comments: 8,
      published_at: '2025-06-10 11:00:00',
    },
    {
      id: 4, slug: 'green-architecture-africa-sustainable-future',
      title: 'Green Architecture in Africa: Building Kenya\'s Sustainable Future',
      excerpt: 'Exploring how Kenyan architects are pioneering eco-friendly building practices that could transform construction across the African continent.',
      content: '<p>Kenya is at the forefront of Africa\'s green architecture movement. From Nairobi\'s first LEED-certified buildings to innovative earth-bag construction in rural communities, Kenyan architects are proving that sustainable building is not just an environmental imperative — it\'s an economic opportunity.</p><p>The concept of green building in Kenya isn\'t entirely new. Traditional African architecture has always been inherently sustainable — using local materials, passive cooling techniques, and designs adapted to local climates. What\'s new is the systematic approach to integrating these principles with modern engineering and technology.</p><p>Leading this charge are firms like Cave Bureau, whose "Descension" project reimagines Nairobi\'s relationship with its volcanic geology, and Orkidstudio, which has pioneered bamboo construction techniques that are both sustainable and seismically resilient. Their work shows that African architects don\'t need to look to the West for innovation — the answers lie in the continent\'s own resources and traditions.</p><p>The Kenya Green Building Society (KGBS) has been instrumental in developing local green building standards that reflect Kenya\'s unique climate, materials, and construction practices. Their benchmarking tool, adapted from international standards, makes it easier for developers to measure and improve their environmental performance.</p>',
      cover_image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800',
      featured_image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1200',
      author_id: 1,
      author_snapshot: '{"name":"Wanjiku Mwangi","slug":"wanjiku-mwangi","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[1, 4]',
      tags: '["green-architecture","sustainability","climate","construction","innovation"]',
      reading_time: 9, stats_views: 1780, stats_likes: 112, stats_comments: 18,
      published_at: '2025-06-20 08:00:00',
    },
    {
      id: 5, slug: 'matatu-culture-art-on-wheels',
      title: 'Matatu Culture: The Moving Canvas of Kenyan Art',
      excerpt: 'How Kenya\'s iconic matatus have become one of the most vibrant and democratic art forms in East African popular culture.',
      content: '<p>There is no art form more democratic, more visible, or more uniquely Kenyan than the matatu. These minibuses, the backbone of Nairobi\'s public transport system, are rolling galleries that showcase the creativity, aspirations, and cultural references of ordinary Kenyans.</p><p>Matatu art has evolved dramatically over the decades. What began as simple hand-painted route numbers has blossomed into elaborate artistic expressions featuring portraits of global icons, references to popular culture, political commentary, and increasingly, original artwork by recognized Kenyan artists.</p><p>The economics of matatu art are fascinating. A single matatu exterior makeover can cost between KES 100,000 and KES 500,000, with the most elaborate designs commanding premium fares. Artists like Moses Nyawanda, known as "Moses the Brand," have built entire careers around matatu design, creating distinctive visual identities for different transport routes.</p><p>Today, matatu culture is gaining international recognition. Documentaries, academic studies, and art exhibitions have brought this grassroots art form to global audiences. Yet at its heart, matatu art remains deeply local — a reflection of the communities that create it and the streets that these vehicles traverse every day.</p>',
      cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      featured_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200',
      author_id: 2,
      author_snapshot: '{"name":"Otieno Kamau","slug":"otieno-kamau","avatar":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[2, 3]',
      tags: '["matatu","street-art","pop-culture","nairobi","transport"]',
      reading_time: 6, stats_views: 3100, stats_likes: 203, stats_comments: 34,
      published_at: '2025-06-28 16:00:00',
    },
    {
      id: 6, slug: 'kenyas-rising-design-ecosystem',
      title: 'Kenya\'s Rising Design Ecosystem: From Local Craft to Global Impact',
      excerpt: 'An inside look at how Kenya\'s designers are building an ecosystem that blends traditional craftsmanship with modern innovation to compete on the world stage.',
      content: '<p>Kenya\'s design ecosystem is experiencing a renaissance. From fashion and product design to UX and industrial design, Kenyan creatives are building something remarkable — an ecosystem that draws strength from tradition while embracing the possibilities of global connectivity.</p><p>The numbers are impressive. Kenya is now home to over 50 design studios, multiple design schools, and a growing number of international design awards won by local practitioners. The Nairobi Design Week, now in its seventh year, attracts participants from across Africa and beyond.</p><p>What sets Kenya\'s design scene apart is its deep connection to craft traditions. Beading, weaving, woodcarving, and metalwork — skills passed down through generations — are being reimagined through a contemporary design lens. Brands like Sandstorm Kenya and Adele Dejak have shown that Kenyan craftsmanship can compete at the highest levels of international design.</p><p>The government has also recognized the economic potential of the creative sector. The Kenya Vision 2030 blueprint specifically identifies the creative economy as a key growth area, and initiatives like the Kenya Film Commission and the Kenya Cultural Centre are providing institutional support for creative entrepreneurs.</p>',
      cover_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      featured_image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200',
      author_id: 1,
      author_snapshot: '{"name":"Wanjiku Mwangi","slug":"wanjiku-mwangi","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[4, 5]',
      tags: '["design","ecosystem","craft","innovation","economy"]',
      reading_time: 7, stats_views: 1240, stats_likes: 67, stats_comments: 9,
      published_at: '2025-07-05 10:00:00',
    },
    {
      id: 7, slug: 'sound-of-silence-kenyan-deaf-artists',
      title: 'The Sound of Silence: Kenyan Deaf Artists Breaking Barriers',
      excerpt: 'Meet the extraordinary Kenyan artists who are redefining creative expression through visual languages that transcend sound.',
      content: '<p>In a world that often equates art with sound — music, spoken word poetry, audio storytelling — Kenyan deaf artists are creating powerful visual art that challenges our assumptions about creativity and communication.</p><p>Artists like Robin Ochieng have developed distinctive styles that reflect their unique experience of the world. Ochieng\'s large-scale paintings, characterized by bold colors and dynamic compositions, capture the visual intensity of a world experienced without sound. His work has been exhibited in Nairobi, Kampala, and London.</p><p>The Deaf Artists Kenya collective, founded in 2019, has been instrumental in creating platforms for deaf creatives. The organization runs workshops, exhibitions, and mentorship programs that help deaf artists develop their skills and connect with audiences. Their annual exhibition, "Visual Voices," has become a highlight of Nairobi\'s art calendar.</p><p>Technology is playing an increasingly important role. Video-based art platforms allow deaf artists to share their creative processes, while social media has created new channels for reaching audiences who might never encounter their work through traditional gallery systems. The result is a growing appreciation for the unique perspectives that deaf artists bring to the creative landscape.</p>',
      cover_image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
      featured_image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200',
      author_id: 3,
      author_snapshot: '{"name":"Amina Hassan","slug":"amina-hassan","avatar":"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[2, 5]',
      tags: '["deaf-art","visual-art","inclusion","disability-art","kenya"]',
      reading_time: 6, stats_views: 960, stats_likes: 73, stats_comments: 15,
      published_at: '2025-07-12 13:00:00',
    },
    {
      id: 8, slug: 'future-african-cities-urban-design',
      title: 'Designing the Future: How African Cities Are Reimagining Urban Spaces',
      excerpt: 'From Nairobi to Kigali, African urban planners and architects are creating blueprints for cities that serve their people, not just their economies.',
      content: '<p>Africa is urbanizing at an unprecedented rate. By 2050, it\'s projected that 60% of Africans will live in cities. For Kenya, where urban population growth is among the highest in the world, this presents both an enormous challenge and a transformative opportunity.</p><p>The question facing Kenyan urban designers is not whether cities will grow, but how they will grow. Will Nairobi and other rapidly expanding cities follow the car-centric, economically segregated models of the 20th century? Or will they chart a new course — one that prioritizes walkability, public space, mixed-use development, and social equity?</p><p>Exciting projects are already pointing the way forward. The Nairobi Rivers Regeneration Project aims to transform the city\'s degraded river corridors into green public spaces. Konza Technopolis, while controversial, represents an attempt to plan a city from scratch around principles of sustainability and smart infrastructure.</p><p>What\'s particularly promising is the growing recognition that African urban design solutions must be African. The "one-size-fits-all" approach imported from Western models has often failed to account for local climates, cultures, and economic realities. Instead, a new generation of Kenyan urban designers is developing approaches that are rooted in local context while being globally informed.</p>',
      cover_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      featured_image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
      author_id: 1,
      author_snapshot: '{"name":"Wanjiku Mwangi","slug":"wanjiku-mwangi","avatar":"https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face"}',
      status: 'published', is_featured: 0,
      category_ids: '[1, 4]',
      tags: '["urban-design","cities","planning","infrastructure","future"]',
      reading_time: 10, stats_views: 2050, stats_likes: 134, stats_comments: 21,
      published_at: '2025-07-18 09:30:00',
    },
  ];

  for (const post of posts) {
    const existing = await query('SELECT id FROM posts WHERE id = ? OR slug = ?', [post.id, post.slug]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        `INSERT INTO posts (id, slug, title, excerpt, content, cover_image, featured_image, author_id, author_snapshot, status, is_featured, category_ids, tags, reading_time, stats_views, stats_likes, stats_comments, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [post.id, post.slug, post.title, post.excerpt, post.content, post.cover_image, post.featured_image, post.author_id, post.author_snapshot, post.status, post.is_featured, post.category_ids, post.tags, post.reading_time, post.stats_views, post.stats_likes, post.stats_comments, post.published_at]
      );
    }
  }
  console.log('  ✓ Posts seeded (8 published)');

  // === EVENTS ===
  const events = [
    {
      id: 1, slug: 'nairobi-design-week-2025',
      title: 'Nairobi Design Week 2025',
      excerpt: 'The biggest design festival in East Africa returns with a week of exhibitions, workshops, talks, and installations celebrating Kenyan creativity.',
      description: '<p>Nairobi Design Week 2025 brings together designers, artists, architects, and creative technologists for seven days of inspiration and collaboration. This year\'s theme, "Designing Tomorrow, Today," explores how Kenyan design can address the challenges and opportunities of the coming decade.</p><p>The festival features over 30 events across multiple venues in Nairobi, including the Kenya National Theatre, the GoDown Arts Centre, and the Nairobi Gallery. Highlights include a keynote by internationally acclaimed designer David Adjaye, a curated exhibition of emerging Kenyan designers, and hands-on workshops on sustainable design practices.</p><p>Whether you\'re a seasoned professional or just curious about design, Nairobi Design Week offers something for everyone. Come discover the creativity that\'s shaping Kenya\'s future.</p>',
      cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      featured_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      location: 'Multiple venues across Nairobi, Kenya',
      is_online: 0, status: 'published',
      start_date: '2025-09-15 09:00:00', end_date: '2025-09-21 22:00:00',
    },
    {
      id: 2, slug: 'east-african-art-summit-2025',
      title: 'East African Art Summit 2025',
      excerpt: 'A virtual summit connecting artists, curators, and collectors from across East Africa to discuss the future of the regional art market.',
      description: '<p>The East African Art Summit returns for its third edition, bringing together the region\'s most influential voices in the art world for three days of panels, portfolio reviews, networking, and virtual exhibitions.</p><p>This year\'s summit focuses on "Crossing Borders: The East African Art Market in a Global Context." Sessions will explore topics including digital art and NFTs, art financing and investment, building sustainable art businesses, and the role of art in social change.</p><p>Featured speakers include representatives from leading galleries, auction houses, and art institutions from Kenya, Tanzania, Uganda, Rwanda, Ethiopia, and the DRC. The summit also includes a virtual exhibition featuring works by 50 emerging artists from across the region.</p>',
      cover_image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
      featured_image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=1200',
      location: 'Online (Virtual Event)',
      is_online: 1, status: 'published',
      start_date: '2025-10-08 10:00:00', end_date: '2025-10-10 18:00:00',
    },
    {
      id: 3, slug: 'heritage-through-lens-photography-workshop',
      title: 'Heritage Through the Lens: Photography Workshop in Lamu',
      excerpt: 'An immersive photography workshop in the historic town of Lamu, exploring how visual storytelling can preserve and celebrate cultural heritage.',
      description: '<p>Join us for a unique three-day photography workshop in the UNESCO World Heritage Site of Lamu Old Town. Led by award-winning photographers from Kenya and beyond, this workshop will explore how photography can serve as a tool for cultural preservation and storytelling.</p><p>Participants will have the opportunity to photograph Lamu\'s stunning architecture, vibrant street life, traditional crafts, and the natural beauty of the Lamu Archipelago. Daily critique sessions, technical workshops, and guided cultural tours will deepen both your photography skills and your understanding of Swahili heritage.</p><p>The workshop is open to photographers of all levels. Accommodation, meals, and local transport are included. Limited to 15 participants to ensure personalized attention.</p>',
      cover_image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
      featured_image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200',
      location: 'Lamu Old Town, Lamu Island, Kenya',
      is_online: 0, status: 'published',
      start_date: '2025-11-12 08:00:00', end_date: '2025-11-14 17:00:00',
    },
  ];

  for (const event of events) {
    const existing = await query('SELECT id FROM events WHERE id = ? OR slug = ?', [event.id, event.slug]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        `INSERT INTO events (id, slug, title, excerpt, description, cover_image, featured_image, location, is_online, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.id, event.slug, event.title, event.excerpt, event.description, event.cover_image, event.featured_image, event.location, event.is_online, event.status, event.start_date, event.end_date]
      );
    }
  }
  console.log('  ✓ Events seeded (3)');

  // === USERS ===
  const users = [
    {
      id: 1, email: 'test@sanaa.com', display_name: 'Test User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      bio: 'A passionate reader and supporter of African creative arts.',
      slug: 'test-user', roles: JSON.stringify(['user']),
      is_public: 1, bookmarks_count: 3, likes_count: 5, comments_count: 3,
      created_at: '2025-05-01 10:00:00',
    },
    {
      id: 2, email: 'admin@sanaa.com', display_name: 'Admin User',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      bio: 'Platform administrator and content curator for Sanaathrumylens.',
      slug: 'admin-user', roles: JSON.stringify(['admin']),
      is_public: 1, bookmarks_count: 2, likes_count: 3, comments_count: 2,
      created_at: '2025-04-15 08:00:00',
    },
  ];

  for (const user of users) {
    const existing = await query('SELECT id FROM users WHERE id = ? OR email = ?', [user.id, user.email]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, password_hash, display_name, avatar, bio, slug, roles, is_public, bookmarks_count, likes_count, comments_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, passwordHash, user.display_name, user.avatar, user.bio, user.slug, user.roles, user.is_public, user.bookmarks_count, user.likes_count, user.comments_count, user.created_at]
      );
    }
  }
  console.log('  ✓ Users seeded (2)');

  // === COMMENTS ===
  const comments = [
    {
      id: 1, post_id: 1, user_id: 1, user_name: 'Test User',
      user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      content: 'This is a beautifully written piece on Lamu\'s architecture. I visited last year and was blown away by the craftsmanship of those carved doors. It\'s encouraging to see young architects drawing inspiration from these traditions.',
      parent_id: null, status: 'visible', likes: 5, created_at: '2025-05-16 14:30:00',
    },
    {
      id: 2, post_id: 2, user_id: 2, user_name: 'Admin User',
      user_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      content: 'The section about Shiro Kiarie was particularly insightful. Her work really exemplifies how Kenyan artists are creating something entirely new while still being deeply rooted in local culture. Would love to see more coverage of individual artists.',
      parent_id: null, status: 'visible', likes: 3, created_at: '2025-06-02 09:15:00',
    },
    {
      id: 3, post_id: 4, user_id: 1, user_name: 'Test User',
      user_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      content: 'As an architecture student, I find articles like this incredibly inspiring. Cave Bureau\'s work is phenomenal — their approach of centering geological history in design thinking is something the global architecture community should pay more attention to.',
      parent_id: null, status: 'visible', likes: 7, created_at: '2025-06-21 11:45:00',
    },
    {
      id: 4, post_id: 5, user_id: null, user_name: 'Wanjiru K.',
      user_avatar: null,
      content: 'Matatus are truly Nairobi\'s moving art galleries! I remember growing up and the excitement of seeing which new matatu designs were on the road. They really are a reflection of the city\'s pulse and creativity. Great article!',
      parent_id: null, status: 'visible', likes: 12, created_at: '2025-06-29 08:20:00',
    },
    {
      id: 5, post_id: 7, user_id: 2, user_name: 'Admin User',
      user_avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
      content: 'This article opened my eyes to a world I knew very little about. The Visual Voices exhibition sounds incredible — I will definitely make an effort to attend next year. Thank you for shedding light on these talented artists.',
      parent_id: null, status: 'visible', likes: 4, created_at: '2025-07-13 16:00:00',
    },
  ];

  for (const comment of comments) {
    const existing = await query('SELECT id FROM comments WHERE id = ?', [comment.id]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        `INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, content, parent_id, status, likes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [comment.id, comment.post_id, comment.user_id, comment.user_name, comment.user_avatar, comment.content, comment.parent_id, comment.status, comment.likes, comment.created_at]
      );
    }
  }
  console.log('  ✓ Comments seeded (5)');

  // === POST LIKES ===
  const postLikes = [
    { post_id: 1, user_id: 1, created_at: '2025-05-16 14:35:00' },
    { post_id: 2, user_id: 1, created_at: '2025-06-02 09:20:00' },
    { post_id: 2, user_id: 2, created_at: '2025-06-02 10:00:00' },
    { post_id: 4, user_id: 1, created_at: '2025-06-21 11:50:00' },
    { post_id: 4, user_id: 2, created_at: '2025-06-22 08:30:00' },
    { post_id: 5, user_id: 1, created_at: '2025-06-29 08:25:00' },
    { post_id: 5, user_id: 2, created_at: '2025-06-30 12:00:00' },
    { post_id: 7, user_id: 1, created_at: '2025-07-13 16:05:00' },
    { post_id: 7, user_id: 2, created_at: '2025-07-14 09:00:00' },
    { post_id: 1, user_id: 2, created_at: '2025-05-20 11:00:00' },
  ];

  for (const like of postLikes) {
    const existing = await query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [like.post_id, like.user_id]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)',
        [like.post_id, like.user_id, like.created_at]
      );
    }
  }
  console.log('  ✓ Post likes seeded (10)');

  // === BOOKMARKS ===
  const bookmarks = [
    { user_id: 1, post_id: 1, created_at: '2025-05-16 15:00:00' },
    { user_id: 1, post_id: 4, created_at: '2025-06-21 12:00:00' },
    { user_id: 1, post_id: 7, created_at: '2025-07-13 16:10:00' },
    { user_id: 2, post_id: 2, created_at: '2025-06-03 08:00:00' },
    { user_id: 2, post_id: 5, created_at: '2025-07-01 10:00:00' },
  ];

  for (const bm of bookmarks) {
    const existing = await query('SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?', [bm.user_id, bm.post_id]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)',
        [bm.user_id, bm.post_id, bm.created_at]
      );
    }
  }
  console.log('  ✓ Bookmarks seeded (5)');

  // === COMMENT LIKES ===
  const commentLikes = [
    { comment_id: 1, user_id: 2, created_at: '2025-05-17 09:00:00' },
    { comment_id: 2, user_id: 1, created_at: '2025-06-03 08:30:00' },
    { comment_id: 3, user_id: 2, created_at: '2025-06-22 09:00:00' },
    { comment_id: 4, user_id: 1, created_at: '2025-06-29 09:00:00' },
    { comment_id: 4, user_id: 2, created_at: '2025-06-30 14:00:00' },
    { comment_id: 5, user_id: 1, created_at: '2025-07-14 09:30:00' },
  ];

  for (const cl of commentLikes) {
    const existing = await query('SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?', [cl.comment_id, cl.user_id]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, ?)',
        [cl.comment_id, cl.user_id, cl.created_at]
      );
    }
  }
  console.log('  ✓ Comment likes seeded (6)');

  // === SUBSCRIBERS ===
  const subscribers = [
    { email: 'reader1@example.com', is_active: 1, subscribed_at: '2025-05-10 10:00:00' },
    { email: 'reader2@example.com', is_active: 1, subscribed_at: '2025-05-20 14:00:00' },
    { email: 'reader3@example.com', is_active: 1, subscribed_at: '2025-06-05 09:00:00' },
    { email: 'reader4@example.com', is_active: 0, subscribed_at: '2025-06-15 11:00:00' },
    { email: 'reader5@example.com', is_active: 1, subscribed_at: '2025-07-01 08:00:00' },
  ];

  for (const sub of subscribers) {
    const existing = await query('SELECT id FROM subscribers WHERE email = ?', [sub.email]);
    const rows = Array.isArray(existing) ? existing : [];
    if (rows.length === 0) {
      await query(
        'INSERT INTO subscribers (email, is_active, subscribed_at) VALUES (?, ?, ?)',
        [sub.email, sub.is_active, sub.subscribed_at]
      );
    }
  }
  console.log('  ✓ Subscribers seeded (5)');

  console.log('\n✅ All seed data inserted successfully!');
}
