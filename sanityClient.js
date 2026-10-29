import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: true, // `true` for fast cached reads, `false` for fresh data
  apiVersion: '2024-01-01'
})
