# Wellness Management System

A comprehensive system for managing medications and wellness activities.

## Features

- User Authentication (Register, Login, Logout)
- Medication Management (One-time and Recurring)
- Rate Limiting
- Redis Caching
- Automated Testing
- API Documentation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wellness-management-system.git
cd wellness-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wellness-management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

4. Start the application:
```bash
npm run dev
```

## Testing

### Automated Tests

The application includes a comprehensive test suite that covers all major functionality. To run the tests:

1. Create a `.env.test` file with test environment variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wellness-management-test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test_jwt_secret
```

2. Run the test suite:
```bash
npm test
```

3. To generate test coverage report:
```bash
npm run test:coverage
```

### API Testing with Postman

The repository includes a Postman collection (`Wellness_Management_System.postman_collection.json`) for manual API testing:

1. Import the collection into Postman:
   - Open Postman
   - Click "Import" button
   - Select the `Wellness_Management_System.postman_collection.json` file

2. Set up environment variables in Postman:
   - Create a new environment
   - Add variable `baseUrl` with value `http://localhost:3000`

3. Test the APIs in the following order:

   a. Authentication:
   - Register a new user (POST /api/auth/register)
   - Login with credentials (POST /api/auth/login)
   - The login response includes a JWT token that will be automatically set for subsequent requests

   b. Medication Management:
   - Add one-time medication (POST /api/medications)
   - Add recurring medication (POST /api/medications)
   - Get all medications (GET /api/medications)
   - Mark medication as done (PATCH /api/medications/:id/done)
   - Delete medication (DELETE /api/medications/:id)

   c. Health Check:
   - Verify API health (GET /health)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 