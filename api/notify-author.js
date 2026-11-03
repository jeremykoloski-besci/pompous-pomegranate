import { Resend } from 'resend'; // Or your preferred email service SDK (e.g., SendGrid/Nodemailer)

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sanity Webhook payload structure
  const { title, email, slug } = req.body;

  if (!email || !title) {
    return res.status(400).json({ error: 'Missing required pitch details for email.' });
  }

  const articleUrl = `https://thepompouspomegranate.com/article/${slug}`;

  try {
    const data = await resend.emails.send({
      from: 'The Pompous Pomegranate <editors@thepompouspomegranate.com>',
      to: [email],
      subject: `Your Satire Pitch Has Been Approved: "${title}"`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; padding: 20px;">
          <h2 style="color: #8b0000;">Congratulations! Your Pitch Was Approved 🎉</h2>
          <p>Our automated editorial review board has approved your satirical submission <strong>"${title}"</strong>.</p>
          <p>Your article is now live on our site for the world to enjoy.</p>
          <p style="margin: 30px 0;">
            <a href="${articleUrl}" style="background-color: #8b0000; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Published Article</a>
          </p>
          <p>Thank you for contributing to the cure for the blues!</p>
          <p><em>— The Editors</em></p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ error: 'Failed to send approval email', details: error.message });
  }
}
