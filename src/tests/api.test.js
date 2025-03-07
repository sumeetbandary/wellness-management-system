const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Medication = require('../models/Medication');
const reportQueue = require('../queues/reportQueue');
const { Worker } = require('bullmq');

describe('Wellness Management System API Tests', () => {
  let authToken;
  let userId;
  let worker;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to test database:', process.env.MONGODB_URI);
    
    // Initialize worker for testing
    worker = new Worker('reportQueue', async () => {}, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await Medication.deleteMany({});
    console.log('Database cleaned before test');
  });

  afterAll(async () => {
    // Clean up and close connections
    await User.deleteMany({});
    await Medication.deleteMany({});
    await mongoose.connection.close();
    
    // Close Redis connections
    if (worker) {
      await worker.close();
    }
    if (reportQueue) {
      await reportQueue.close();
    }
    console.log('Database cleaned after all tests');
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

      // Verify user was created in database
      const user = await User.findById(userId);
      expect(user).toBeTruthy();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
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

      // Verify token was removed
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.tokens).toHaveLength(0);
    });
  });

  describe('Medication Management', () => {
    beforeEach(async () => {
      // Create a user and get token
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

      // Verify medication was created in database
      const medication = await Medication.findById(res.body.data.medication._id);
      expect(medication).toBeTruthy();
      expect(medication.medicineName).toBe('Test Medicine');
      expect(medication.user.toString()).toBe(userId.toString());
    });

    test('Should add recurring medication', async () => {
      const res = await request(app)
        .post('/api/medications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          medicineName: 'Recurring Medicine',
          description: 'Recurring Description',
          type: 'recurring',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 3600000).toISOString(), // 7 days from now
          recurringType: 'daily',
          dayOfWeek: 'monday'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.medication).toHaveProperty('_id');

      // Verify medication was created in database
      const medication = await Medication.findById(res.body.data.medication._id);
      expect(medication).toBeTruthy();
      expect(medication.medicineName).toBe('Recurring Medicine');
      expect(medication.type).toBe('recurring');
      expect(medication.user.toString()).toBe(userId.toString());
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

      // Verify medication was updated in database
      const updatedMedication = await Medication.findById(medication._id);
      expect(updatedMedication.status).toBe('done');
    });
  });
}); 