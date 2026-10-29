export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const projectId = '5hfaqg7';
  const dataset = 'production';
  const apiVersion = '2026-10-29';

  // Using perspective=previewDrafts so it fetches both published and draft posts
  const query = encodeURIComponent(`*[_type == "post"] | order(_updatedAt desc) {
      _id,
      title,
      slug,
      body,
      "category": categories[0]->title,
      "author": author->name,
      "imageUrl": mainImage.asset->url,
      publishedAt
  }`);

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}&perspective=previewDrafts`;
  const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return res.status(200).json({ result: data.result || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Sanity', details: error.message });
  }
}
