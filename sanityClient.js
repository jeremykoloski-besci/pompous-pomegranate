import { createClient } from 'https://esm.sh/@sanity/client';

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: false, // Switch to false to bypass CDN caching and permission restrictions
  apiVersion: '2024-03-01'
});
