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
          slug,
          body,
          "author": author->name,
          mainImage,
          "imageUrl": mainImage.asset->url,
          "likes": coalesce(likes, 0),
          publishedAt
        },
        "allPosts": *[_type == "post"] | order(publishedAt desc) {
          _id,
          title,
          slug,
          mainImage,
          "imageUrl": mainImage.asset->url,
          publishedAt
        },
        "pitches": *[_type == "pitch"] | order(submittedAt desc) {
          _id,
          author,
          headline,
          body,
          submittedAt,
          image,
          mainImage,
          photo,
          picture
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
      let rawPosts = data.result?.allPosts || [];
      let rawPitches = data.result?.pitches || [];

      // Format community pitches into standard post shapes so they can share prev/next navigation seamlessly
      let formattedPitches = rawPitches.map(p => {
        let bodyText = "";
        const raw = p.body;
        if (typeof raw === 'string') {
          bodyText = raw;
        } else if (Array.isArray(raw)) {
          bodyText = raw.map(b => b.children ? b.children.map(c => c.text).join('') : '').join('\n');
        } else if (raw && typeof raw === 'object') {
          bodyText = raw.body || raw.text || raw.content || JSON.stringify(raw);
        }

        const pSlug = (p.headline || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return {
          _id: p._id,
          title: p.headline || "Untitled Pitch",
          slug: { current: pSlug },
          body: bodyText,
          author: p.author || "Anonymous Pomp",
          mainImage: p.mainImage || p.image || null,
          imageUrl: p.image || p.mainImage?.asset->url || p.photo || p.picture || null,
          likes: 0,
          publishedAt: p.submittedAt || p._createdAt
        };
      });

      // Combine both regular posts and community pitches into a unified chronological feed
      let unifiedFeed = [...rawPosts, ...formattedPitches].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // Match community pitch if not found in official posts
      if (!result && rawPitches) {
        const matchingPitch = formattedPitches.find(p => p.slug.current === slugParam);
        if (matchingPitch) {
          result = matchingPitch;
        }
      }

      if (result && unifiedFeed.length > 0) {
        const currentIndex = unifiedFeed.findIndex(p => p.slug?.current === slugParam);
        
        const nextPost = currentIndex > 0 ? unifiedFeed[currentIndex - 1] : null;
        const prevPost = currentIndex >= 0 && currentIndex < unifiedFeed.length - 1 ? unifiedFeed[currentIndex + 1] : null;

        result.prevPost = prevPost ? { title: prevPost.title, slug: prevPost.slug?.current, imageUrl: prevPost.imageUrl, mainImage: prevPost.mainImage } : null;
        result.nextPost = nextPost ? { title: nextPost.title, slug: nextPost.slug?.current, imageUrl: nextPost.imageUrl, mainImage: nextPost.mainImage } : null;
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
        mainImage,
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
        image,
        mainImage,
        photo,
        picture
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
