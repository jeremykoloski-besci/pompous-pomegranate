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
      from: 'The Pompous Pomegranate <onboarding@resend.dev>',
      to: [email],
      subject: `Your Satire Pitch Has Been Approved: "${articleTitle}"`,
      html: `<p>Your pitch "${articleTitle}" has been approved! <a href="https://thepompouspomegranate.com/article/${slug}">View Article</a></p>`,
    });
    
    console.log('RESEND SUCCESS:', JSON.stringify(data));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('RESEND ERROR CATCH:', err.message || err);
    return res.status(500).json({ error: err.message });
  }
}
