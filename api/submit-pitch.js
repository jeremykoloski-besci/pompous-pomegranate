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

  const { author, email, headline, body } = req.body;

  if (!author || !headline) {
    return res.status(400).json({ error: 'Author and headline are required.' });
  }

  const projectId = '5hfaqqg7';
  const dataset = 'production';
  const apiVersion = '2026-10-29';
  const token = 'sk4ndQcGiWdxdDgNSfo789OpmhEuFeCmIybfPSwfFi9LkTX7dSAA4YjQxI2Y7yK8RsJWEia2L5TPZkNlfsBpMtJrIygua0JRuzYqXoSKviyPELlPJLdIe4Nokig8KGWSnSLyFo3AnH4ei8dZHqArBXdYBkBTj8O5KMUv8MCMtMFYm5ueAXSb';

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`;

  // Ensure body is stored as a clean string matching the 'text' schema type
  let bodyString = body;
  if (typeof body === 'object') {
    bodyString = body.text || body.content || JSON.stringify(body);
  }

  const mutationPayload = {
    mutations: [
      {
        create: {
          _type: 'pitch',
          author: author,
          email: email || '',
          headline: headline,
          body: String(bodyString || ''), // Plain text string
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
      const detailedError = data.error?.message || JSON.stringify(data);
      return res.status(500).json({ error: 'Sanity Mutation Failed', details: detailedError });
    }

    return res.status(200).json({ success: true, message: 'Pitch submitted for review!' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error saving pitch', details: error.message });
  }
}
