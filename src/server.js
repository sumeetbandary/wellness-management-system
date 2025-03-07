const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimiter } = require('./middleware/rateLimiter');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const medicationRoutes = require('./routes/medicationRoutes');

// Only import these in non-test environment
let initMedicationReminders;
let scheduleWeeklyReports;
if (process.env.NODE_ENV !== 'test') {
  initMedicationReminders = require('./utils/medicationReminder');
  scheduleWeeklyReports = require('./utils/reportScheduler');
}

require('dotenv').config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Apply rate limiter to all routes except in test environment
if (process.env.NODE_ENV !== 'test' && rateLimiter) {
  app.use(rateLimiter);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Only initialize these in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      // Initialize medication reminders
      initMedicationReminders();
      
      // Initialize weekly report scheduler
      scheduleWeeklyReports();
    }
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app; 