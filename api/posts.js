export default async function handler(req, res) {
  const projectId = '5hfaqg7';
  const dataset = 'production';
  const query = encodeURIComponent(`*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      body,
      "category": categories[0]->title,
      "author": author->name,
      "imageUrl": mainImage.asset->url,
      publishedAt
  }`);

  const url = `https://${projectId}.api.sanity.io/v2024-03-01/data/query/${dataset}?query=${query}`;
  const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    // Enable CORS from your Vercel frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Sanity', details: error.message });
  }
}
