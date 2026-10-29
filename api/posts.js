export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Hardcoded test response to confirm Vercel is running the newest code
  return res.status(200).json({
    testMessage: "Vercel is running the latest code!",
    timestamp: new Date().toISOString(),
    result: [
      {
        _id: "test-1",
        title: "Test Article: Local Dog Explains Crypto",
        category: "Breaking Satire",
        author: "Jerome",
        publishedAt: new Date().toISOString(),
        body: [{ _type: "block", children: [{ text: "This is a test block content to verify rendering." }] }]
      }
    ]
  });
}
