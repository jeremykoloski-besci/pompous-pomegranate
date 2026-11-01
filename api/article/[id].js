import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '5hfaqqg7',
  dataset: 'production',
  apiVersion: '2026-03-01',
  useCdn: true,
});

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Fetch the specific post or pitch from Sanity
    const post = await client.fetch(`*[_id == $id][0]{title, "imageUrl": mainImage.asset->url, excerpt}`, { id });

    if (!post) {
      return res.status(404).send('Article not found');
    }

    // Return a server-rendered HTML page with custom OG tags for social scrapers, 
    // then immediately redirect regular human visitors to your main frontend app.
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${post.title} - The Pompous Pomegranate</title>
          
          <!-- Dynamic Open Graph Tags for Social Bots -->
          <meta property="og:title" content="${post.title}">
          <meta property="og:description" content="${post.excerpt || 'Fake news to cure the blues.'}">
          <meta property="og:image" content="${post.imageUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'}">
          <meta property="og:url" content="https://pompouspomegranate.com/article/${id}">
          
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${post.title}">
          <meta name="twitter:image" content="${post.imageUrl}">

          <!-- Redirect human visitors to the frontend reader view -->
          <meta http-equiv="refresh" content="0;url=/index.html?article=${id}">
      </head>
      <body>
          <p>Redirecting to <a href="/index.html?article=${id}">${post.title}</a>...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('OG Tag generation error:', error);
    return res.status(500).send('Server Error');
  }
}
