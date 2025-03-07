# Wellness Management System

A comprehensive health and wellness management system built with Node.js, Express, MongoDB, and Redis.

## Features

- User Authentication (Register, Login, Logout)
- Medication Management
  - One-time medications
  - Recurring medications (daily/weekly)
  - Medication status tracking
- Email Notifications
  - Medication reminders
  - Weekly reports
- Rate Limiting
- API Documentation with Swagger
- Docker Support
- Comprehensive Testing

## Tech Stack

- Node.js & Express.js
- MongoDB (Database)
- Redis (Rate Limiting & Queue)
- BullMQ (Job Queue)
- JWT (Authentication)
- Jest & Supertest (Testing)
- Swagger/OpenAPI (API Documentation)
- Docker & Docker Compose

## Prerequisites

- Node.js >= 18
- MongoDB
- Redis
- Docker (optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sumeetbandary/wellness-management-system.git
   cd wellness-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Start the server:
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Docker Setup

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Stop containers:
   ```bash
   docker-compose down
   ```

## API Documentation

Access the Swagger documentation at:
```
http://localhost:8080/api-docs
```

## Testing

Run tests:
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_APP_PASSWORD` - Gmail app password

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── utils/          # Utility functions
├── validators/     # Request validators
├── queues/         # Job queues
└── tests/          # Test files
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user

### Medications
- POST `/api/medications` - Add new medication
- GET `/api/medications` - Get all medications
- PATCH `/api/medications/:id/done` - Mark medication as done
- DELETE `/api/medications/:id` - Delete medication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

Sumeet Bandary 