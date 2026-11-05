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
  const apiVersion = '2026-10-29';
  const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

  // --- 1. SINGLE ARTICLE QUERY (If a slug is passed) ---
  if (slug) {
    const singleQuery = encodeURIComponent(`*[_type == "post" && slug.current == "${slug}"][0]{
      title,
      body,
      "author": author->name,
      "imageUrl": mainImage.asset->url,
      publishedAt
    }`);

    const singleUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${singleQuery}`;

    try {
      const response = await fetch(singleUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return res.status(200).json({ result: data.result || null });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch article from Sanity', details: error.message });
    }
  }

  // --- 2. STANDARD FEED QUERY (Posts, Pitches, Fact Check, Breaking) ---
  const query = encodeURIComponent(`{
    "posts": *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      body,
      "category": categories[0]->title,
      "author": author->name,
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
  }`);

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${query}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    return res.status(200).json({ 
      result: data.result?.posts || [], 
      pitches: data.result?.pitches || [],
      factCheck: data.result?.factCheck || null,
      breaking: data.result?.breaking || null 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch from Sanity', details: error.message });
  }
};
