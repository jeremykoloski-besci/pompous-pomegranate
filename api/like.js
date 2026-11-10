import { createClient } from '@sanity/client';

const client = createClient({
    projectId: '5hfaqqg7',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2026-03-01',
    token: process.env.SANITY_API_TOKEN, // Requires write permissions
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

    const { postId } = req.body;

    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required.' });
    }

    try {
        // Increment the like count by 1 in Sanity using patch/inc
        const updatedPost = await client
            .patch(postId)
            .setIfMissing({ likes: 0 })
            .inc({ likes: 1 })
            .commit();

        return res.status(200).json({ success: true, likes: updatedPost.likes });
    } catch (err) {
        console.error('Like error:', err);
        return res.status(500).json({ error: 'Failed to register like.' });
    }
}
