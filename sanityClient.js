import { createClient } from 'https://esm.sh/@sanity/client';

export const client = createClient({
  projectId: '5hfaqg7',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-03-01',
  token: 'skUaP8VnZYnUOJV7kpwTHWWBwpORkNkhEuAmO3idhBkNOl4APE5bwRBtpUisdgQiIpgXaxBpQV1Or7FKCUlnHzSHb7hQG9rFUYzVfA7XWD8mkLLMGlbCMIZFsMV9sUD1mXrHLRkP7o7Up8OInPFfGNee1KbOqHBkRE6xkrrLnJrWEPBy4fX6
', 
  ignoreBrowserTokenWarning: true
});
