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
    // Query fetching the current article AND the latest breaking post for the top banner
    const sanityQuery = `{
      "article": *[_type in ["post", "pitch"] && (slug.current == "${id}" || slug.current match "*${id}*" || _id == "${id}" || lower(headline) match "*${id.replace(/-/g, ' ')}*")][0]{
        title,
        headline,
        "imageUrl": mainImage.asset->url,
        "pitchImageUrl": image.asset->url,
        body,
        publishedAt,
        submittedAt,
        "category": categories[0]->title
      },
      "breaking": *[_type == "post"] | order(publishedAt desc)[0] {
        title,
        slug
      }
    }`;

    const encodedQuery = encodeURIComponent(sanityQuery);
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodedQuery}`;

    const data = await fetchJson(url);
    const doc = data.result?.article;
    const breakingData = data.result?.breaking;

    if (!doc) {
      return res.status(404).send(`Article not found for: ${id}`);
    }

    const title = doc.title || doc.headline || 'Satire Article';
    const rawDate = doc.publishedAt || doc.submittedAt;
    const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'Recent';
    const category = doc.category || (doc.headline ? 'Community Pitch' : 'Satire');
    const imageUrl = doc.imageUrl || doc.pitchImageUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    let htmlContent = '<p>No content provided.</p>';
    if (Array.isArray(doc.body)) {
      htmlContent = doc.body.map(block => {
        if (block._type === 'block' && block.children) {
          return `<p>${block.children.map(c => c.text || '').join('')}</p>`;
        }
        return '';
      }).join('');
    } else if (typeof doc.body === 'string' && doc.body.trim() !== '') {
      htmlContent = doc.body.split('\n').map(para => `<p>${para}</p>`).join('');
    } else if (title) {
      htmlContent = `<p>${title}</p>`;
    }

    const articleUrl = `https://pompous-pomegranate.vercel.app/article/${id}`;
    const encodedUrl = encodeURIComponent(articleUrl);
    const encodedTitle = encodeURIComponent(title);

    // Prepare breaking news variables for template injection
    const breakingTitle = breakingData?.title || "";
    const breakingSlug = breakingData?.slug?.current || "#";
    const breakingDisplay = breakingData ? "block" : "none";

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
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Zilla+Slab:wght@700;900&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="/styles.css">
          <style>
              body { font-family: 'Merriweather', serif; background: var(--bg-color, #f9f9f9); color: var(--text-primary, #1a1a1a); margin: 0; padding: 0; line-height: 1.8; }
              .article-page-container { max-width: 800px; margin: 40px auto; background: var(--card-bg, #fff); padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
              .category-tag { background: #8B0000; color: #fff; padding: 4px 10px; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
              h1 { font-family: 'Zilla Slab', serif; font-size: 2.5rem; margin-top: 0; line-height: 1.2; }
              .meta { font-size: 0.9rem; color: var(--text-secondary, #666); margin-bottom: 20px; font-family: sans-serif; }
              .hero-img { width: 100%; border-radius: 6px; margin-bottom: 20px; }
              .share-bar { display: flex; justify-content: center; gap: 20px; padding: 15px 0; background: inherit; border-top: 1px solid var(--border-color, #eee); border-bottom: 1px solid var(--border-color, #eee); margin-bottom: 30px; }
              .share-btn { font-size: 1.3rem; color: #D4AF37; background: none; border: none; cursor: pointer; text-decoration: none; transition: transform 0.2s; }
              .share-btn:hover { transform: scale(1.1); }
              .article-body { font-size: 1.15rem; margin-bottom: 40px; }
              .back-home { display: inline-block; margin-top: 20px; color: #8B0000; font-weight: bold; text-decoration: none; font-family: sans-serif; }
              .back-home:hover { text-decoration: underline; }
          </style>
      </head>
      <body>
          <!-- Top Announcement Bar (Dynamic Breaking News matching Homepage) -->
          <div class="announcement-bar" id="breakingBar" style="display: ${breakingDisplay};">
              <span id="breakingContent">🚨 BREAKING: ${breakingTitle} <a href="/article/${breakingSlug}">Read Story &rarr;</a></span>
          </div>

          <!-- Header & Navigation matching Homepage -->
          <header class="site-header">
              <div class="header-container">
                  <div class="header-left">
                      <button class="menu-toggle" id="menuToggle"><i class="fa-solid fa-bars"></i></button>
                      <div class="current-date" id="currentDate"></div>
                  </div>
                  
                  <div class="logo-area">
                      <a href="/" class="site-title-link">
                          <div class="brand-logo-wrapper">
                              <svg class="pomegranate-icon" viewBox="0 0 100 100" width="46" height="46" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M40 18 L50 6 L60 18 L68 12 L64 24 L36 24 L32 12 Z" fill="#8B0000" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
                                  <circle cx="50" cy="56" r="36" fill="#8B0000" stroke="#1A1A1A" stroke-width="4"/>
                                  <path d="M35 48 C35 40, 65 40, 65 48 C65 65, 35 65, 35 48 Z" fill="#D4AF37" opacity="0.9"/>
                                  <circle cx="44" cy="48" r="3" fill="#600000"/>
                                  <circle cx="54" cy="48" r="3" fill="#600000"/>
                                  <circle cx="49" cy="56" r="3.5" fill="#600000"/>
                              </svg>
                              <div class="brand-title-text">
                                  <span class="title-prefix">The</span>
                                  <span class="title-main">Pompous Pomegranate</span>
                              </div>
                          </div>
                      </a>
                      <p class="site-tagline">Fake news to cure the blues</p>
                  </div>

                  <div class="header-right">
                      <button class="theme-toggle" id="themeToggle" title="Toggle Dark/Light Mode">
                          <i class="fa-solid fa-moon"></i>
                      </button>
                  </div>
              </div>

              <nav class="main-nav">
                  <ul>
                      <li><a href="/?category=all" class="nav-link">Home</a></li>
                      <li><a href="/?category=politics" class="nav-link">Politics</a></li>
                      <li><a href="/?category=tech" class="nav-link">Tech & AI</a></li>
                      <li><a href="/?category=culture" class="nav-link">Culture</a></li>
                      <li><a href="/?category=opinion" class="nav-link">Opinion</a></li>
                      <li><a href="/?category=pitches" class="nav-link">Community Pitches</a></li>
                  </ul>
              </nav>
          </header>

          <div class="article-page-container">
              <span class="category-tag">${category}</span>
              <h1>${title}</h1>
              <div class="meta"><span><i class="fa-regular fa-clock"></i> ${formattedDate}</span></div>
              <img src="${imageUrl}" alt="Article Image" class="hero-img">
              
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

          <script>
              // Current Date Display in Header
              const dateEl = document.getElementById('currentDate');
              if (dateEl) {
                  dateEl.textContent = new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  });
              }

              // Dark/Light Theme Toggle
              const themeToggle = document.getElementById('themeToggle');
              const body = document.body;

              if (themeToggle) {
                  themeToggle.addEventListener('click', () => {
                      if (body.getAttribute('data-theme') === 'dark') {
                          body.removeAttribute('data-theme');
                          themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
                      } else {
                          body.setAttribute('data-theme', 'dark');
                          themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
                      }
                  });
              }
          </script>
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
