const projectId = '5hfaqg7';
const dataset = 'production';
const query = encodeURIComponent('*[_type == "post"]'); // Adjust to your actual document type
const url = `https://${projectId}.api.sanity.io/v2024-03-01/data/query/${dataset}?query=${query}`;

// Replace with your actual token string
const token = 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6';

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log("Fetched articles from Sanity:", data.result);
    // TODO: Write code here to inject data.result into your HTML container!
  })
  .catch(err => console.error("Fetch error:", err));
