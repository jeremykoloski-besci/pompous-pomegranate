const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Article identifier missing');
  }

  const projectId = '5hfaqqg7';
  const dataset = 'production';
  const apiVersion = '2026-10-29';

  try {
    // Single robust query searching both standard posts and pitches for matching slugs or IDs
    const sanityQuery = `*[_type in ["post", "pitch"] && (slug.current == "${id}" || slug.current match "*${id}*" || _id == "${id}" || lower(headline) match "*${id.replace(/-/g, ' ')}*")][0]{
      title,
      headline,
      "imageUrl": mainImage.asset->url,
      "pitchImageUrl": image.asset->url,
      body,
      author,
      "authorName": author->name,
      publishedAt,
      submittedAt,
      "category": categories[0]->title
    }`;

    const encodedQuery = encodeURIComponent(sanityQuery);
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodedQuery}`;

    const data = await fetchJson(url);
    const doc = data.result;

    if (!doc) {
      return res.status(404).send(`Article not found for: ${id}`);
    }

    // Normalize fields between posts and pitches
    const title = doc.title || doc.headline || 'Satire Article';
    const author = doc.authorName || doc.author || 'Staff';
    const publishedAt = doc.publishedAt || doc.submittedAt;
    const category = doc.category || (doc.headline ? 'Community Pitch' : 'Satire');
    const imageUrl = doc.imageUrl || doc.pitchImageUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    // Robust content parser supporting both Portable Text arrays and plain text strings
    let htmlContent = '<p>No content provided.</p>';
    if (Array.isArray(doc.body)) {
      htmlContent = doc.body.map(block => {
        if (block._type === 'block' && block.children) {
          return `<p>${block.children.map(c => c.text || '').join('')}</p>`;
        }
        return '';
      }).join('');
    } else if (typeof doc.body === 'string' && doc.body.trim() !== '') {
      // Split plain text by newlines so paragraphs format nicely
      htmlContent = doc.body.split('\n').map(para => `<p>${para}</p>`).join('');
    } else if (title) {
      htmlContent = `<p>${title}</p>`;
    }

    const articleUrl = `https://pompous-pomegranate.vercel.app/article/${id}`;
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(title);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - The Pompous Pomegranate</title>
          <meta property="og:type" content="article">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="Fake news to cure the blues.">
          <meta property="og:image" content="${imageUrl}">
          <meta property="og:url" content="${articleUrl}">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Zilla+Slab:wght@700;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Merriweather', serif; background: #f9f9f9; color: #1a1a1a; margin: 0; padding: 0; line-height: 1.8; }
              header { background: #1a1a1a; color: #fff; padding: 15px 20px; text-align: center; font-family: 'Zilla Slab', serif; font-size: 1.5rem; }
              header a { color: #fff; text-decoration: none; }
              .container { max-width: 800px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .category-tag { background: #8B0000; color: #fff; padding: 4px 10px; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
              h1 { font-family: 'Zilla Slab', serif; font-size: 2.5rem; margin-top: 0; line-height: 1.2; }
              .meta { font-size: 0.9rem; color: #666; margin-bottom: 20px; font-family: sans-serif; }
              .hero-img { width: 100%; border-radius: 6px; margin-bottom: 20px; }
              .share-bar { display: flex; justify-content: center; gap: 20px; padding: 15px 0; background: #fff; border-top: 1px solid #eee; border-bottom: 1px solid #eee; margin-bottom: 30px; }
              .share-btn { font-size: 1.3rem; color: #D4AF37; background: none; border: none; cursor: pointer; text-decoration: none; transition: transform 0.2s; }
              .share-btn:hover { transform: scale(1.1); }
              .article-body { font-size: 1.15rem; margin-bottom: 40px; }
              .back-home { display: inline-block; margin-top: 20px; color: #8B0000; font-weight: bold; text-decoration: none; font-family: sans-serif; }
              .back-home:hover { text-decoration: underline; }
          </style>
      </head>
      <body>
          <header><a href="/">The Pompous Pomegranate</a></header>
          <div class="container">
              <span class="category-tag">${category}</span>
              <h1>${title}</h1>
              <div class="meta"><span>By ${author}</span> • <span>${publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Recent'}</span></div>
              <img src="${imageUrl}" alt="Article Image" class="hero-img">
              
              <!-- Social Share Bar with X & TikTok -->
              <div class="share-bar">
                  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" class="share-btn" title="Share on Facebook"><i class="fa-brands fa-square-facebook"></i></a>
                  <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" class="share-btn" title="Share on X"><i class="fa-brands fa-x-twitter"></i></a>
                  <a href="https://www.tiktok.com/@pompouspomegranate" target="_blank" class="share-btn" title="Follow us on TikTok"><i class="fa-brands fa-tiktok"></i></a>
                  <a href="mailto:?subject=${encodedTitle}&body=Check out this article: ${encodedUrl}" class="share-btn" title="Share via Email"><i class="fa-solid fa-envelope"></i></a>
                  <button onclick="navigator.clipboard.writeText('${articleUrl}'); alert('Link copied to clipboard!');" class="share-btn" title="Copy Link" style="background:none; border:none; cursor:pointer;"><i class="fa-solid fa-link"></i></button>
              </div>

              <div class="article-body">${htmlContent}</div>
              <a href="/" class="back-home">&larr; Back to Home Feed</a>
          </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Serverless fetch crash:', error);
    return res.status(500).send(`Server Error: ${error.message}`);
  }
};
