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
      const groqQuery = `{
        "post": *[_type == "post" && slug.current == $slug][0]{
          _id,
          title,
          body,
          "author": author->name,
          "imageUrl": mainImage.asset->url,
          "likes": coalesce(likes, 0),
          publishedAt
        },
        "pitches": *[_type == "pitch"] | order(submittedAt desc) {
          _id,
          author,
          headline,
          body,
          submittedAt,
          "imageUrl": coalesce(image.asset._ref, mainImage.asset._ref, photo.asset._ref, picture.asset._ref)
        }
      }`;

      const params = new URLSearchParams();
      params.append('query', groqQuery);
      params.append('$slug', `"${slugParam}"`);

      const sanityUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${params.toString()}`;
      const sanityResponse = await fetch(sanityUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await sanityResponse.json();

      let result = data.result?.post || null;

      // Match community pitch by exact slugified headline
      if (!result && data.result?.pitches) {
        const matchingPitch = data.result.pitches.find(p => {
          const pSlug = (p.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return pSlug === slugParam;
        });

        if (matchingPitch) {
          let bodyText = "";
          const raw = matchingPitch.body;

          if (typeof raw === 'string') {
            bodyText = raw;
          } else if (Array.isArray(raw)) {
            bodyText = raw.map(b => b.children ? b.children.map(c => c.text).join('') : '').join('\n');
          } else if (raw && typeof raw === 'object') {
            bodyText = raw.body || raw.text || raw.content || JSON.stringify(raw);
          }

          result = {
            _id: matchingPitch._id,
            title: matchingPitch.headline || "Untitled Pitch",
            body: bodyText,
            author: matchingPitch.author || "Anonymous Pomp",
            imageUrl: matchingPitch.imageUrl || null, // Passes raw asset ref to frontend urlForSanityImage()
            likes: 0,
            publishedAt: matchingPitch.submittedAt || matchingPitch._createdAt
          };
        }
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
        "likes": coalesce(likes, 0),
        publishedAt
      },
      "pitches": *[_type == "pitch"] | order(submittedAt desc) {
        _id,
        author,
        headline,
        body,
        submittedAt,
        "imageUrl": coalesce(image.asset._ref, mainImage.asset._ref, photo.asset._ref, picture.asset._ref)
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
