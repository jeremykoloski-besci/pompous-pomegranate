// Instead of client.fetch(query), use a direct public fetch request:
const projectId = '5hfaqg7';
const dataset = 'production';
const query = encodeURIComponent('*[_type == "post"]'); // Update with your actual query if different
const url = `https://${projectId}.api.sanity.io/v2024-03-01/data/query/${dataset}?query=${query}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log("Fetched articles:", data.result);
    // Render your articles into your HTML grid here
  })
  .catch(err => console.error("Fetch error:", err));
