require('dotenv').config({ path: '.env.test' });

// Ensure we're using the test database
process.env.MONGODB_URI = process.env.MONGODB_URI.replace(
  /\/[^/]+$/,
  '/wellness-management-test'
); 