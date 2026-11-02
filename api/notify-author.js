export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { author, headline, email, status } = req.body;

  // Only trigger if the pitch was approved and an email exists
  if (status !== 'approved' || !email || !headline) {
    return res.status(200).json({ success: true, message: 'Skipped notification (not approved or missing email).' });
  }

  const resendApiKey = process.env.RESEND_API_KEY; // Store securely in Vercel Environment Variables

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'The Pompous Pomegranate <editors@pompouspomegranate.com>',
        to: [email],
        subject: '🎉 Your Satirical Article Has Been Published!',
        html: `
          <div style="font-family: Georgia, serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B0000; border-bottom: 2px solid #8B0000; padding-bottom: 10px;">The Pompous Pomegranate</h2>
            <p>Great news, <strong>${author || 'Valued Writer'}</strong>!</p>
            <p>Our editorial board has reviewed your submission, and your article titled <strong>"${headline}"</strong> has officially been approved and published to the global feed.</p>
            <p>Thank you for contributing to the pinnacle of satirical journalism. You can view your live piece on the site now!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 0.85rem; color: #666; font-style: italic;">The Pompous Pomegranate Editorial Board</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Failed to send email via Resend');
    }

    return res.status(200).json({ success: true, message: 'Author notification email sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Error sending notification email', details: error.message });
  }
}
