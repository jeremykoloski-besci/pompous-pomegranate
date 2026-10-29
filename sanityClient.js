import { createClient } from 'https://esm.sh/@sanity/client';

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: true, // set to true for faster delivery of published content
  apiVersion: '2024-03-01' // use current date or your studio api version
});
