import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, headline, email, slug } = req.body;
  const articleTitle = title || headline;

  if (!email || !articleTitle) {
    return res.status(400).json({ error: 'Missing required pitch details.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL: RESEND_API_KEY is missing!');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const resend = new Resend(apiKey);
    
    // Await the email dispatch *before* returning the response to Sanity
    const data = await resend.emails.send({
      from: 'The Pompous Pomegranate <onboarding@resend.dev>', // Switch to your domain once verified!
      to: [email],
      subject: `🎉 Your Satire Pitch Has Been Approved: "${articleTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
              .header { background: #18181b; color: #ffffff; padding: 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px; }
              .content { padding: 32px 24px; color: #27272a; line-height: 1.6; }
              .title-box { background: #fafafa; border-left: 4px solid #18181b; padding: 16px; margin: 20px 0; font-style: italic; color: #3f3f46; }
              .button-container { text-align: center; margin: 32px 0 16px 0; }
              .btn { background: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; }
              .footer { text-align: center; font-size: 12px; color: #a1a1aa; padding: 24px; border-top: 1px solid #e4e4e7; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>The Pompous Pomegranate</h1>
              </div>
              <div class="content">
                <p>Great news! Your pitch has been officially approved by the editorial team.</p>
                <div class="title-box">
                  "${articleTitle}"
                </div>
                <p>Our editors are moving forward with your piece. You can view your live article slug and updates using the link below:</p>
                <div class="button-container">
                  <a href="https://thepompouspomegranate.com/article/${slug}" class="btn">View Article Dashboard</a>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} The Pompous Pomegranate. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log('RESEND SUCCESS:', JSON.stringify(data));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('RESEND ERROR CATCH:', err.message || err);
    return res.status(500).json({ error: err.message });
  }
}
