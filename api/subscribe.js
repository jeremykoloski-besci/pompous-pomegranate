import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '5hfaqqg7', // Hardcoded safely here
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2026-03-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
    }

    try {
        // 1. Save subscriber to Sanity CMS
        const newSubscriber = await client.create({
            _type: 'subscriber',
            email: email,
            subscribedAt: new Date().toISOString(),
        });

        // 2. Send automated confirmation email using Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'The Pompous Pomegranate <editors@pompouspomegranate.com>',
                to: [email],
                subject: 'Welcome to The Daily Seed 🌿',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                        <h2 style="color: #8b0000; font-family: Georgia, serif;">Welcome to The Daily Seed!</h2>
                        <p>Thank you for subscribing to <strong>The Pompous Pomegranate</strong>. You have officially chosen fake news over existential dread, and for that, our editorial staff salutes you.</p>
                        <p>Expect our finest fabricated headlines delivered straight to your inbox so you never have to face reality unprotected.</p>
                        <hr style="border: none; border-top: 1px solid #e6e2d8; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666;">If you didn't sign up for this, someone who thinks you're funny probably did it for you.</p>
                    </div>
                `
            })
        });

        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error('Resend API Error:', errorData);
            // Even if email fails, subscriber is saved in Sanity
        }

        return res.status(200).json({ success: true, message: 'Subscribed successfully!' });
    } catch (err) {
        console.error('Subscription error:', err);
        return res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
}
