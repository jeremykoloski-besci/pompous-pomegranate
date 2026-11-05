module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;
  const projectId = '5hfaqqg7';
  const dataset = 'production';
  const apiVersion = '2023-05-03'; // Using a stable API version
  const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

  try {
    // --- 1. SINGLE ARTICLE QUERY ---
    if (slug) {
      const singleQuery = `*[_type == "post" && slug.current == "${slug}"][0]{
        title,
        body,
        "author": coalesce(author->name, "Anonymous Pomp"),
        "imageUrl": mainImage.asset->url,
        publishedAt
      }`;

      const singleUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(singleQuery)}`;

      const response = await fetch(singleUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'Sanity API error' });
      }

      return res.status(200).json({ result: data.result || null });
    }

    // --- 2. STANDARD FEED QUERY ---
    const query = `{
      "posts": *[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        body,
        "category": coalesce(categories[0]->title, "General Satire"),
        "author": coalesce(author->name, "Anonymous Pomp"),
        "imageUrl": mainImage.asset->url,
        publishedAt
      },
      "pitches": *[_type == "pitch"] | order(submittedAt desc) {
        _id,
        author,
        headline,
        body,
        submittedAt,
        "imageUrl": image.asset->url
      },
      "factCheck": *[_type == "factCheck"] | order(publishedAt desc)[0] {
        claim,
        verdict
      },
      "breaking": *[_type == "post"] | order(publishedAt desc)[0] {
        title,
        slug
      }
    }`;

    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Sanity API error' });
    }

    return res.status(200).json({ 
      result: data.result?.posts || [], 
      pitches: data.result?.pitches || [],
      factCheck: data.result?.factCheck || null,
      breaking: data.result?.breaking || null 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server proxy error', details: error.message });
  }
};
