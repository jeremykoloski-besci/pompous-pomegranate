import { createClient } from '@sanity/client';

const client = createClient({
    projectId: '5hfaqqg7',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2026-03-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
});

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

    const { email } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
    }

    try {
        // 1. Check if the email already exists in Sanity
        const existingSubscriber = await client.fetch(
            `*[_type == "subscriber" && email == $email][0]`,
            { email: cleanEmail }
        );

        if (existingSubscriber) {
            return res.status(400).json({ error: 'This email is already subscribed to The Daily Seed!' });
        }

        // 2. Save new subscriber to Sanity CMS
        await client.create({
            _type: 'subscriber',
            email: cleanEmail,
            subscribedAt: new Date().toISOString(),
        });

        // 3. Send automated confirmation email using Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'The Pompous Pomegranate <onboarding@resend.dev>',
                to: [cleanEmail],
                subject: 'Welcome to The Daily Seed 🌿',
                html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; }
                          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
                          .header { background: #8b0000; color: #ffffff; padding: 24px; text-align: center; }
                          .header h1 { margin: 0; font-size: 22px; font-family: Georgia, serif; letter-spacing: -0.5px; }
                          .content { padding: 32px 24px; color: #27272a; line-height: 1.6; }
                          .highlight-box { background: #fafafa; border-left: 4px solid #8b0000; padding: 16px; margin: 20px 0; color: #3f3f46; }
                          .button-container { text-align: center; margin: 32px 0 16px 0; }
                          .btn { background: #8b0000; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; }
                          .footer { text-align: center; font-size: 12px; color: #a1a1aa; padding: 24px; border-top: 1px solid #e4e4e7; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h1>The Pompous Pomegranate</h1>
                          </div>
                          <div class="content">
                            <h2 style="color: #1a1a1a; font-family: Georgia, serif; margin-top: 0;">Welcome to The Daily Seed!</h2>
                            <p>Thank you for subscribing to <strong>The Pompous Pomegranate</strong>. You have officially chosen fake news over existential dread, and for that, our editorial staff salutes you.</p>
                            <div class="highlight-box">
                              Expect our finest fabricated headlines and briefings delivered straight to your inbox so you never have to face reality unprotected.
                            </div>
                            <div class="button-container">
                              <a href="https://pompous-pomegranate.vercel.app" class="btn">Visit The Daily Feed</a>
                            </div>
                            <p style="font-size: 13px; color: #71717a; margin-top: 30px;">If you didn't sign up for this, someone who thinks you're funny probably did it for you.</p>
                          </div>
                          <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} The Pompous Pomegranate. All rights reserved.</p>
                          </div>
                        </div>
                      </body>
                    </html>
                `
            })
        });

        return res.status(200).json({ success: true, message: 'Subscribed successfully!' });
    } catch (err) {
        console.error('Subscription error:', err);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
}
