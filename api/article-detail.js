export default async function handler(req, res) {
  const { slug } = req.query;
  const projectId = '5hfaqg7';
  const dataset = 'production';

  const query = `*[_type == "post" && slug.current == "${slug}"][0]{
    title,
    body,
    "author": author->name,
    "imageUrl": mainImage.asset->url,
    publishedAt
  }`;

  const url = `https://${projectId}.api.sanity.io/v2024-03-01/data/query/${dataset}?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch article from Sanity' });
  }
}
