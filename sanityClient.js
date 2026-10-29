import { createClient } from 'https://esm.sh/@sanity/client@6.20.0';

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-03-01'
});
