export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const title = searchParams.get('title') || 'The Pompous Pomegranate';
    const imageUrl = searchParams.get('image') || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    // Return a clean HTML page with Open Graph or an SVG image response, 
    // or redirect/render a lightweight layout card.
    // Alternatively, we can output an SVG directly which platforms accept as images:
    
    const svgContent = `
      <svg width="1200" height="1100" viewBox="0 0 1200 1100" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { font-family: Georgia, serif; font-size: 42px; font-weight: bold; fill: #1a1a1a; }
          .badge-text { font-family: sans-serif; font-size: 16px; font-weight: 800; fill: #111111; }
        </style>
        <!-- Background -->
        <rect width="1200" height="1100" fill="#ffffff"/>
        
        <!-- Top Image Area Background -->
        <rect width="1200" height="680" fill="#18181b"/>
        
        <!-- Gold Corner Badge -->
        <g transform="translate(900, 600)">
          <rect width="270" height="60" rx="4" fill="#f5b841" />
          <text x="20" y="25" class="badge-text">Read the article at</text>
          <text x="20" y="45" class="badge-text">ThePompousPomegranate.com</text>
        </g>

        <!-- Bottom White Panel Title -->
        <foreignObject x="60" y="740" width="1080" height="240">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; font-size: 42px; font-weight: bold; color: #1a1a1a; line-height: 1.2; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
            ${title}
          </div>
        </foreignObject>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(svgContent);

  } catch (err) {
    console.error('OG Generation Error:', err);
    return res.status(500).send('Error generating image');
  }
}
