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

  const { author, headline, body } = req.body; // <--- Capture body here

  if (!author || !headline) {
    return res.status(400).json({ error: 'Author and headline are required.' });
  }

  const projectId = '5hfaqqg7';
  const dataset = 'production';
  const apiVersion = '2026-10-29';
  const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`;

  const mutationPayload = {
    mutations: [
      {
        create: {
          _type: 'pitch',
          author: author,
          headline: headline,
          body: body || '', // <--- Save body to Sanity document
          status: 'pending',
          submittedAt: new Date().toISOString()
        }
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + token
      },
      body: JSON.stringify(mutationPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to write pitch to Sanity');
    }

    return res.status(200).json({ success: true, message: 'Pitch submitted for review!' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error saving pitch', details: error.message });
  }
}
