import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { slug } = req.query;

  // Read your existing index.html file
  const indexPath = path.join(process.cwd(), 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  try {
    // Query Sanity for matching post OR approved pitch
    const query = encodeURIComponent(`*[slug.current == "${slug}" || _id == "${slug}"][0]{
      title,
      headline,
      "imageUrl": coalesce(imageUrl, mainImage.asset->url, image.asset->url, coverImage.asset->url)
    }`);

    const sanityRes = await fetch(
      `https://5hfaqqg7.api.sanity.io/v2023-05-03/data/query/production?query=${query}`
    );
    const { result: post } = await sanityRes.json();

    if (post) {
      const title = post.title || post.headline || 'The Pompous Pomegranate';
      const rawImage =
        post.imageUrl ||
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

      if (post) {
      const title = post.title || post.headline || 'The Pompous Pomegranate';
      const rawImage =
        post.imageUrl ||
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

      // Ensure both title and image are passed to the OG generator
      const ogImageUrl = `https://www.thepompouspomegranate.com/api/og?title=${encodeURIComponent(
        title
      )}&image=${encodeURIComponent(rawImage)}`;
      const pageUrl = `https://www.thepompouspomegranate.com/article/${slug}`;

      const metaTags = `
        <title>${title} – The Pompous Pomegranate</title>
        <meta property="og:type" content="article" />
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="100% Verified Satire from The Pompous Pomegranate." />
        <meta property="og:image" content="${ogImageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1100" />
        <meta property="og:url" content="${pageUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${ogImageUrl}" />
      `;

      // Remove any static title, og:, and twitter: tags so old fallbacks don't interfere
      html = html.replace(/<title>.*?<\/title>/gi, '');
      html = html.replace(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
      html = html.replace(/<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
      
      // Inject dynamic tags right before </head>
      html = html.replace('</head>', `${metaTags}\n</head>`);
    }
      const pageUrl = `https://www.thepompouspomegranate.com/article/${slug}`;

      const metaTags = `
        <title>${title} – The Pompous Pomegranate</title>
        <meta property="og:type" content="article" />
        <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta property="og:description" content="100% Verified Satire from The Pompous Pomegranate." />
        <meta property="og:image" content="${ogImageUrl}" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1100" />
        <meta property="og:url" content="${pageUrl}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${ogImageUrl}" />
      `;

      // Remove any static title, og:, and twitter: tags so old fallbacks don't interfere
      html = html.replace(/<title>.*?<\/title>/gi, '');
      html = html.replace(/<meta[^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
      html = html.replace(/<meta[^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
      
      // Inject dynamic tags right before </head>
      html = html.replace('</head>', `${metaTags}\n</head>`);
    }
  } catch (err) {
    console.error('Error injecting article meta tags:', err);
  }

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(html);
}
