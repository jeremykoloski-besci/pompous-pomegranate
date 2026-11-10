export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlParams = new URL(req.url, `https://${req.headers.host}`).searchParams;
    const slugParam = urlParams.get('slug') || '';

    const projectId = '5hfaqqg7';
    const dataset = 'production';
    const apiVersion = '2023-05-03';
    const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

    // --- 1. SINGLE ARTICLE / PITCH QUERY ---
    if (slugParam) {
      // Extract the unique ID from the end of the slug (e.g. "my-headline-abc123xyz" -> "abc123xyz")
      const pitchId = slugParam.split('-').pop();
      const cleanSlug = slugParam.replace(/-[0-9a-fA-F]{10,}$/, '');

      // Query Sanity directly for EITHER a regular post by slug OR a pitch by exact _id
      const groqQuery = `{
        "post": *[_type == "post" && slug.current == $slug][0]{
          title,
          body,
          "author": author->name,
          "imageUrl": mainImage.asset->url,
          publishedAt
        },
        "pitch": *[_type == "pitch" && _id == $pitchId][0]{
          _id,
          author,
          headline,
          body,
          submittedAt,
          "imageUrl": coalesce(image.asset->url, mainImage.asset->url, photo.asset->url, picture.asset->url)
        }
      }`;

      const params = new URLSearchParams();
      params.append('query', groqQuery);
      params.append('$slug', `"${cleanSlug}"`);
      params.append('$pitchId', `"${pitchId}"`);

      const sanityUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${params.toString()}`;
      const sanityResponse = await fetch(sanityUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await sanityResponse.json();

      let result = null;

      if (data.result?.post) {
        result = data.result.post;
      } else if (data.result?.pitch) {
        const p = data.result.pitch;
        
        // Normalize body text safely regardless of how it was submitted
        let bodyText = "";
        const raw = p.body;
        if (typeof raw === 'string') {
          if (raw.trim().startsWith('{') || raw.includes('"author":')) {
            try {
              const parsed = JSON.parse(raw);
              bodyText = parsed.body || parsed.text || parsed.content || raw;
            } catch (e) {
              bodyText = raw;
            }
          } else {
            bodyText = raw;
          }
        } else if (Array.isArray(raw)) {
          bodyText = raw.map(b => b.children ? b.children.map(c => c.text).join('') : '').join('\n');
        } else if (raw && typeof raw === 'object') {
          bodyText = raw.body || raw.text || raw.content || JSON.stringify(raw);
        }

        result = {
          title: p.headline || "Untitled Pitch",
          body: bodyText,
          author: p.author || "Anonymous Pomp",
          imageUrl: p.imageUrl || null,
          publishedAt: p.submittedAt || p._createdAt
        };
      }

      return res.status(200).json({ result });
    }

    // --- 2. STANDARD FEED QUERY ---
    const groqQuery = `{
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
        "imageUrl": coalesce(image.asset->url, mainImage.asset->url, photo.asset->url, picture.asset->url)
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

    const sanityUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(groqQuery)}`;
    const sanityResponse = await fetch(sanityUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await sanityResponse.json();

    return res.status(200).json({ 
      result: data.result?.posts || [], 
      pitches: data.result?.pitches || [],
      factCheck: data.result?.factCheck || null,
      breaking: data.result?.breaking || null 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Function execution failed', 
      message: error.message 
    });
  }
}
