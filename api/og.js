export default async function handler(req, res) {
  try {
   const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const title = searchParams.get('title') || 'The Pompous Pomegranate';
    
    // Use a clean, reliable Unsplash photo or default satirical banner as the top half
    const imageUrl = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    // Fetch the article photo and convert to Base64
    const imgRes = await fetch(imageUrl);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const base64Img = `data:${contentType};base64,${imgBuffer.toString('base64')}`;

    // Word wrap headline into lines (~32 chars per line)
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= 32) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    const escapeXml = (str) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const startY = lines.length === 1 ? 810 : lines.length === 2 ? 785 : 755;
    const headlineSvg = lines
      .slice(0, 3)
      .map(
        (line, i) =>
          `<text x="600" y="${startY + i * 52}" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="#1a1a1a">${escapeXml(
            line
          )}</text>`
      )
      .join('');

    const svgMarkup = `
      <svg width="1200" height="1100" viewBox="0 0 1200 1100" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="1100" fill="#ffffff"/>
        <rect width="1200" height="680" fill="#18181b"/>
        <image href="${base64Img}" x="0" y="0" width="1200" height="680" preserveAspectRatio="xMidYMid slice" />
        <rect y="680" width="1200" height="420" fill="#ffffff"/>
        ${headlineSvg}
        <g transform="translate(572, 975) scale(1.4)">
          <path d="M12 7L14.5 2L18.5 6L22.5 2L25 7H12Z" fill="#991b1b"/>
          <circle cx="18.5" cy="20" r="13" fill="#991b1b"/>
          <circle cx="18.5" cy="20" r="8" fill="#f5b841"/>
          <circle cx="16" cy="18" r="1.5" fill="#991b1b"/>
          <circle cx="21" cy="18" r="1.5" fill="#991b1b"/>
          <circle cx="18.5" cy="23" r="1.5" fill="#991b1b"/>
        </g>
      </svg>
    `;

    // Return the SVG directly with image/svg+xml header (Facebook and social crawlers natively support SVG, and modern servers render it instantly without compilation crashes)
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(svgMarkup);
  } catch (err) {
    console.error('OG Error:', err);
    return res.status(500).send('Error generating preview');
  }
}
