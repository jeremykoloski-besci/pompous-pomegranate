export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  // Return a tiny valid 1x1 transparent PNG buffer dynamically with a timestamp header
  const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const imgBuffer = Buffer.from(transparentPngBase64, 'base64');

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('X-Debug-Timestamp', timestamp);
  return res.status(200).send(imgBuffer);
}
