import { Resvg } from '@resvg/resvg-js';

export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const title = searchParams.get('title') || 'Local Man Sweats Profusely While Explaining Cryptocurrency to a Golden Retriever';
    const imageUrl =
      searchParams.get('image') ||
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    // Fetch the article photo and convert to Base64
    const imgRes = await fetch(imageUrl);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const base64Img = `data:${contentType};base64,${imgBuffer.toString('base64')}`;

    // Clean up XML special characters
    const safeTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const svg = `
      <svg width="1200" height="1100" viewBox="0 0 1200 1100" xmlns="http://www.w3.org/2000/svg">
        <!-- White Background -->
        <rect width="1200" height="1100" fill="#ffffff"/>
        
        <!-- Top Article Photo Area -->
        <rect width="1200" height="680" fill="#18181b"/>
        <image href="${base64Img}" x="0" y="0" width="1200" height="680" preserveAspectRatio="xMidYMid slice" />

        <!-- Bottom White Panel -->
        <rect y="680" width="1200" height="420" fill="#ffffff"/>

        <!-- Headline inside the White Panel -->
        <foreignObject x="80" y="720" width="1040" height="220">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; font-size: 42px; font-weight: bold; color: #1a1a1a; line-height: 1.25; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
            ${safeTitle}
          </div>
        </foreignObject>

        <!-- Pomegranate Brand Emblem at bottom center -->
        <g transform="translate(572, 970) scale(1.4)">
          <path d="M12 7L14.5 2L18.5 6L22.5 2L25 7H12Z" fill="#991b1b"/>
          <circle cx="18.5" cy="20" r="13" fill="#991b1b"/>
          <circle cx="18.5" cy="20" r="8" fill="#f5b841"/>
          <circle cx="16" cy="18" r="1.5" fill="#991b1b"/>
          <circle cx="21" cy="18" r="1.5" fill="#991b1b"/>
          <circle cx="18.5" cy="23" r="1.5" fill="#991b1b"/>
        </g>
      </svg>
    `;

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngBuffer = resvg.render().asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error('PNG Generation Error:', err);
    return res.status(500).send('Failed to generate PNG');
  }
}
