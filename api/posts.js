export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlParams = new URL(req.url, `https://${req.headers.host}`).searchParams;
    const slug = urlParams.get('slug');

    const projectId = '5hfaqqg7';
    const dataset = 'production';
    const apiVersion = '2023-05-03';
    const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

    // --- 1. SINGLE ARTICLE / PITCH QUERY ---
    if (slug) {
      const groqQuery = `{
        "post": *[_type == "post" && slug.current == $slug][0]{
          title,
          body,
          "author": author->name,
          "imageUrl": mainImage.asset->url,
          publishedAt
        },
        "pitches": *[_type == "pitch"]{
          ...
        }
      }`;

      const params = new URLSearchParams();
      params.append('query', groqQuery);
      params.append('$slug', `"${slug}"`);

      const sanityUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${params.toString()}`;
      const sanityResponse = await fetch(sanityUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await sanityResponse.json();

      let result = data.result?.post || null;

      if (!result && data.result?.pitches) {
        const matchingPitch = data.result.pitches.find(p => {
          const pSlug = (p.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || p._id;
          return pSlug === slug || p._id === slug;
        });

        if (matchingPitch) {
          console.log("MATCHED PITCH RAW DATA:", JSON.stringify(matchingPitch, null, 2));

          // Extract text and image dynamically from any possible property name
          const textVal = matchingPitch.body || matchingPitch.text || matchingPitch.content || matchingPitch.description || "";
          let finalBody = "";
          if (typeof textVal === 'string') {
            finalBody = textVal;
          } else if (typeof textVal === 'object' && textVal !== null) {
            finalBody = textVal.body || textVal.text || textVal.content || textVal.message || JSON.stringify(textVal);
          }

          // Check all possible image fields in Sanity
          let imageUrl = null;
          const imgField = matchingPitch.image || matchingPitch.mainImage || matchingPitch.photo || matchingPitch.picture || matchingPitch.file;
          if (imgField && imgField.asset && imgField.asset._ref) {
            // Convert Sanity asset reference to a CDN URL if it's a raw ref
            // Format: image-{assetId}-{dimensions}-{extension}
            const ref = imgField.asset._ref;
            const [, id, dimensions, extension] = ref.split('-');
            imageUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${extension}`;
          } else if (imgField && imgField.asset && imgField.asset->url) {
            imageUrl = imgField.asset->url;
          }

          result = {
            title: matchingPitch.headline || matchingPitch.title || "Untitled Pitch",
            body: finalBody,
            author: matchingPitch.author || matchingPitch.name || "Anonymous Pomp",
            imageUrl: imageUrl || null,
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
        publishedAt
      },
      "pitches": *[_type == "pitch"] | order(_createdAt desc) {
        _id,
        author,
        headline,
        body,
        submittedAt,
        _createdAt
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
