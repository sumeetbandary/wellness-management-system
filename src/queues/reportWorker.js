const { Worker } = require('bullmq');
const { parse } = require('@json2csv/node');
const fs = require('fs').promises;
const path = require('path');
const Medication = require('../models/Medication');
const { sendMedicationReminder } = require('../utils/emailService');

const processReport = async (job) => {
  const { userId, email, startDate, endDate } = job.data;
  
  try {
    // Fetch completed medications for the date range
    const medications = await Medication.find({
      user: userId,
      status: 'done',
      updatedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('user', 'name email');

    // Prepare data for CSV
    const medicationData = medications.map(med => ({
      MedicineName: med.medicineName,
      Description: med.description,
      Type: med.type,
      ScheduledTime: med.type === 'one-time' ? med.dateTime : `${med.startDate} to ${med.endDate}`,
      RecurringType: med.recurringType || 'N/A',
      CompletedAt: med.updatedAt,
      UserName: med.user.name,
      UserEmail: med.user.email
    }));

    if (medicationData.length === 0) {
      await sendMedicationReminder(
        email,
        null,
        null,
        'Weekly Medication Report',
        'No medications were taken during this period.'
      );
      return;
    }

    // Generate CSV
    const fields = ['MedicineName', 'Description', 'Type', 'ScheduledTime', 'RecurringType', 'CompletedAt', 'UserName', 'UserEmail'];
    const csv = await parse(medicationData, { fields });

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../../reports');
    await fs.mkdir(reportsDir, { recursive: true });

    // Save CSV file
    const fileName = `medication_report_${startDate}_to_${endDate}.csv`;
    const filePath = path.join(reportsDir, fileName);
    await fs.writeFile(filePath, csv);

    // Send email with CSV attachment
    await sendMedicationReminder(
      email,
      null,
      null,
      'Weekly Medication Report',
      `Please find attached your medication report for the period ${startDate} to ${endDate}.`,
      [{
        filename: fileName,
        path: filePath
      }]
    );

    // Clean up the file
    await fs.unlink(filePath);

    return { success: true, message: 'Report generated and sent successfully' };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

const worker = new Worker('reportQueue', processReport, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

worker.on('completed', job => {
  console.log(`Report job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Report job ${job.id} failed:`, err);
});

module.exports = worker; 