import { createClient } from 'https://esm.sh/@sanity/client';

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-03-01',
  ignoreBrowserTokenWarning: true
});
