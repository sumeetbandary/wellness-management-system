const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['one-time', 'recurring'],
    required: true
  },
  // For one-time medications
  dateTime: {
    type: Date,
    required: function() {
      return this.type === 'one-time';
    }
  },
  // For recurring medications
  startDate: {
    type: Date,
    required: function() {
      return this.type === 'recurring';
    }
  },
  endDate: {
    type: Date,
    required: function() {
      return this.type === 'recurring';
    }
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly'],
    required: function() {
      return this.type === 'recurring';
    }
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: function() {
      return this.type === 'recurring' && this.recurringType === 'weekly';
    }
  },
  status: {
    type: String,
    enum: ['pending', 'done'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication; 