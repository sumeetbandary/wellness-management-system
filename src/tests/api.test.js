const request = require('supertest');
const mongoose = require('mongoose');
process.env.NODE_ENV = 'test'; // Set test environment before requiring app
const app = require('../server');
const User = require('../models/User');
const Medication = require('../models/Medication');
const { redis: initRedis } = require('../middleware/rateLimiter');

describe('Wellness Management System API Tests', () => {
  let authToken;
  let userId;
  let redisClient;

  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to test database:', process.env.MONGODB_URI);
      
      // Initialize Redis
      redisClient = initRedis();
      if (redisClient) {
        await redisClient.flushall();
      }
    } catch (error) {
      console.log('Setup error:', error);
    }
  });

  beforeEach(async () => {
    try {
      // Clean up database before each test
      await User.deleteMany({});
      await Medication.deleteMany({});
      // Clear rate limiter data
      if (redisClient) {
        await redisClient.flushdb();
      }
      console.log('Database cleaned before test');
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  afterAll(async () => {
    try {
      // Clean up and close connections
      await User.deleteMany({});
      await Medication.deleteMany({});
      await mongoose.connection.close();
      if (redisClient) {
        await redisClient.quit();
      }
      console.log('Database cleaned and connections closed after all tests');
    } catch (error) {
      console.log('Teardown error:', error);
    }
  });

  describe('Authentication', () => {
    test('Should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
      userId = res.body.data.user._id;
    });

    test('Should login user', async () => {
      // First create a user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    test('Should logout user', async () => {
      // First create and login a user
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      const token = await user.generateAuthToken();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('Medication Management', () => {
    beforeEach(async () => {
      // Create a user and get token for each test
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      userId = user._id;
      authToken = await user.generateAuthToken();
    });

    test('Should add one-time medication', async () => {
      const res = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicineName: 'Test Medicine',
          description: 'Test Description',
          type: 'one-time',
          dateTime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.medication).toHaveProperty('_id');
    });

    test('Should add recurring medication', async () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const res = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicineName: 'Recurring Medicine',
          description: 'Recurring Description',
          type: 'recurring',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          recurringType: 'daily'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.medication).toHaveProperty('_id');
    });

    test('Should get user medications', async () => {
      // First create some medications
      await Medication.create([
        {
          user: userId,
          medicineName: 'Medicine 1',
          type: 'one-time',
          dateTime: new Date()
        },
        {
          user: userId,
          medicineName: 'Medicine 2',
          type: 'recurring',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 3600000),
          recurringType: 'daily'
        }
      ]);

      const res = await request(app)
        .get('/api/medications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.medications)).toBeTruthy();
      expect(res.body.data.medications).toHaveLength(2);
    });

    test('Should mark medication as done', async () => {
      // First create a medication
      const medication = await Medication.create({
        user: userId,
        medicineName: 'Test Medicine',
        type: 'one-time',
        dateTime: new Date()
      });

      const res = await request(app)
        .patch(`/api/medications/${medication._id}/done`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.medication.status).toBe('done');
    });
  });
}); 