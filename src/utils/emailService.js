const nodemailer = require('nodemailer');

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD // Use App Password for Gmail
  }
});

// Generic email sending function
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"Health & Wellness System" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Specific email templates
const sendMedicationReminder = async (userEmail, medicineName, time, subject = 'Medication Reminder', customMessage = null, attachments = []) => {
  const html = customMessage || `
    <h2>Medication Reminder</h2>
    <p>It's time to take your medication:</p>
    <h3>${medicineName}</h3>
    <p>Scheduled time: ${time}</p>
    <p>Please don't forget to mark it as done in the app once taken.</p>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
    attachments
  });
};

const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <h2>Welcome to Health & Wellness System!</h2>
    <p>Hello ${userName},</p>
    <p>Thank you for joining our platform. We're here to help you manage your medications and wellness journey.</p>
    <p>Get started by:</p>
    <ul>
      <li>Adding your medications</li>
      <li>Setting up reminders</li>
      <li>Checking your weekly reports</li>
    </ul>
    <p>If you have any questions, feel free to reach out to our support team.</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Health & Wellness System',
    html
  });
};

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Reset Request',
    html
  });
};

module.exports = {
  sendEmail,
  sendMedicationReminder,
  sendWelcomeEmail,
  sendPasswordResetEmail
}; 