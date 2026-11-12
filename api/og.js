import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Grab title and image from the URL query string
    const title = searchParams.get('title') || 'The Pompous Pomegranate';
    const imageUrl =
      searchParams.get('image') ||
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            fontFamily: 'Georgia, serif',
          }}
        >
          {/* TOP SECTION: Article Photo + Bottom-Right Gold Badge */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              width: '100%',
              height: '62%',
              backgroundColor: '#18181b',
            }}
          >
            <img
              src={imageUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Gold Corner Watermark Badge */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                backgroundColor: '#f5b841',
                color: '#111111',
                padding: '8px 14px',
                borderRadius: '4px',
                fontFamily: 'sans-serif',
                fontSize: '18px',
                fontWeight: 800,
                lineHeight: 1.2,
                boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
              }}
            >
              <span>Read the article at</span>
              <span>ThePompousPomegranate.com</span>
            </div>
          </div>

          {/* BOTTOM SECTION: White Box + Centered Headline + Pomegranate Icon */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              height: '38%',
              padding: '32px 50px 28px 50px',
              backgroundColor: '#ffffff',
              textAlign: 'center',
            }}
          >
            {/* Article Headline */}
            <div
              style={{
                display: 'flex',
                fontSize: title.length > 75 ? '36px' : '44px',
                fontWeight: 700,
                color: '#1a1a1a',
                lineHeight: 1.2,
                justifyContent: 'center',
              }}
            >
              {title}
            </div>

            {/* Centered Pomegranate Brand Emblem */}
            <svg
              width="54"
              height="54"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Crown */}
              <path
                d="M24 14L27 7L32 12L37 7L40 14H24Z"
                fill="#991b1b"
              />
              {/* Pomegranate Body */}
              <circle cx="32" cy="36" r="21" fill="#991b1b" />
              {/* Inner Seed Detail */}
              <circle cx="32" cy="36" r="13" fill="#f5b841" />
              <circle cx="28" cy="33" r="2.5" fill="#991b1b" />
              <circle cx="36" cy="33" r="2.5" fill="#991b1b" />
              <circle cx="32" cy="40" r="2.5" fill="#991b1b" />
            </svg>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1100,
      }
    );
  } catch (e) {
    console.error('OG Image Error:', e.message);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
