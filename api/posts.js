module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { slug } = req.query || {};
    const projectId = '5hfaqqg7';
    const dataset = 'production';
    const apiVersion = '2023-05-03';
    const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

    let groqQuery = '';

    if (slug) {
      groqQuery = `*[_type == "post" && slug.current == $slug][0]{
        title,
        body,
        "author": author->name,
        "imageUrl": mainImage.asset->url,
        publishedAt
      }`;
    } else {
      groqQuery = `{
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
      }`;
    }

    // Safely encode parameters using URLSearchParams
    const params = new URLSearchParams();
    params.append('query', groqQuery);
    if (slug) {
      params.append('$slug', `"${slug}"`);
    }

    const sanityUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${params.toString()}`;

    const sanityResponse = await fetch(sanityUrl, {
      headers: { 
        'Authorization': `Bearer ${token}` 
      }
    });

    const data = await sanityResponse.json();

    if (slug) {
      return res.status(200).json({ result: data.result || null });
    }

    return res.status(200).json({ 
      result: data.result?.posts || [], 
      pitches: data.result?.pitches || [],
      factCheck: data.result?.factCheck || null,
      breaking: data.result?.breaking || null 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Server function crash caught', 
      message: error.message 
    });
  }
};
