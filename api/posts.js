export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
  
  // REPLACE THIS STRING WITH YOUR NEWLY GENERATED SANITY API TOKEN
  const token = 'skmWxT7MDzSxirEYkPFljqd0cwVFHDSomO3lMLsNnxQafb4zsIrEXDKexNJFD3X0Jy6Oc6hROAtPFmvyeH0YlFHfqwoXPjIbEy9Cts6QuPsMBNITTleY2shKptpxFu7m2Z5tstIV3QhhalNxq942uI1yA32ZJEMLZIFblm2mBizwY722y60S';

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
