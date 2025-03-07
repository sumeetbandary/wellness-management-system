const cron = require('node-cron');
const Medication = require('../models/Medication');
const User = require('../models/User');
const { sendMedicationReminder } = require('./emailService');

// Helper function to check if a medication is due
const isMedicationDue = (medication) => {
  const now = new Date();
  const currentTime = now.getTime();

  if (medication.type === 'one-time') {
    const medicationTime = new Date(medication.dateTime).getTime();
    // Check if the medication is due within the last minute
    return currentTime - medicationTime >= 0 && currentTime - medicationTime < 60000;
  }

  if (medication.type === 'recurring') {
    // Check if current date is within the medication period
    if (currentTime < new Date(medication.startDate).getTime() || 
        currentTime > new Date(medication.endDate).getTime()) {
      return false;
    }

    if (medication.recurringType === 'daily') {
      // For daily medications, check if the current time matches
      const medicationDate = new Date(medication.startDate);
      return now.getHours() === medicationDate.getHours() && 
             now.getMinutes() === medicationDate.getMinutes();
    }

    if (medication.recurringType === 'weekly') {
      // For weekly medications, check if it's the correct day and time
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[now.getDay()];
      
      if (today === medication.dayOfWeek) {
        const medicationDate = new Date(medication.startDate);
        return now.getHours() === medicationDate.getHours() && 
               now.getMinutes() === medicationDate.getMinutes();
      }
    }
  }

  return false;
};

// Initialize cron job
const initMedicationReminders = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Find all pending medications
      const medications = await Medication.find({ 
        status: 'pending'
      }).populate('user', 'email');

      for (const medication of medications) {
        if (isMedicationDue(medication)) {
          await sendMedicationReminder(
            medication.user.email,
            medication.medicineName,
            medication.type === 'one-time' 
              ? new Date(medication.dateTime).toLocaleString()
              : new Date(medication.startDate).toLocaleTimeString()
          );
        }
      }
    } catch (error) {
      console.error('Error in medication reminder cron job:', error);
    }
  });

  console.log('Medication reminder cron job initialized');
};

module.exports = initMedicationReminders; 