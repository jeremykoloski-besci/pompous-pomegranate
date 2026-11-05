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

  // Acknowledge Sanity instantly with 200 OK
  res.status(200).json({ success: true });

  console.log('Webhook received for email:', email);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('CRITICAL: RESEND_API_KEY is missing from Vercel environment variables!');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    console.log('Attempting to send email via Resend...');
    
    const data = await resend.emails.send({
      from: 'The Pompous Pomegranate <onboarding@resend.dev>',
      to: [email],
      subject: `Your Satire Pitch Has Been Approved: "${articleTitle}"`,
      html: `<p>Your pitch "${articleTitle}" has been approved! <a href="https://thepompouspomegranate.com/article/${slug}">View Article</a></p>`,
    });
    
    console.log('Resend success response data:', JSON.stringify(data));
  } catch (err) {
    console.error('RESEND CRITICAL ERROR:', err);
  }
}
