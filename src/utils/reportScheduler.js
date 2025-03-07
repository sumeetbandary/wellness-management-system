const cron = require('node-cron');
const User = require('../models/User');
const reportQueue = require('../queues/reportQueue');

const scheduleWeeklyReports = () => {
  // Run every Sunday at 00:00
  cron.schedule('0 0 * * 0', async () => {
    try {
      const users = await User.find({});
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      for (const user of users) {
        await reportQueue.add('generateReport', {
          userId: user._id,
          email: user.email,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      }

      console.log('Weekly report generation jobs scheduled');
    } catch (error) {
      console.error('Error scheduling weekly reports:', error);
    }
  });

  console.log('Weekly report scheduler initialized');
};

module.exports = scheduleWeeklyReports; 