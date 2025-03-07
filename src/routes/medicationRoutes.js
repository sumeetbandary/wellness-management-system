const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');

const router = express.Router();

// Validation middleware
const medicationValidation = [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
  body('type').isIn(['one-time', 'recurring']).withMessage('Type must be one-time or recurring'),
  body('dateTime')
    .if(body('type').equals('one-time'))
    .isISO8601()
    .withMessage('Valid date and time required for one-time medication'),
  body('startDate')
    .if(body('type').equals('recurring'))
    .isISO8601()
    .withMessage('Valid start date required for recurring medication'),
  body('endDate')
    .if(body('type').equals('recurring'))
    .isISO8601()
    .withMessage('Valid end date required for recurring medication'),
  body('recurringType')
    .if(body('type').equals('recurring'))
    .isIn(['daily', 'weekly'])
    .withMessage('Recurring type must be daily or weekly'),
  body('dayOfWeek')
    .if(body('type').equals('recurring'))
    .if(body('recurringType').equals('weekly'))
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Valid day of week required for weekly medication')
];

// Add medication
router.post('/', auth, medicationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const medication = new Medication({
      ...req.body,
      user: req.user._id
    });

    await medication.save();

    res.status(201).json({
      status: 'success',
      data: {
        medication
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get user's medications
router.get('/', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.user._id });
    
    res.json({
      status: 'success',
      data: {
        medications
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Mark medication as done
router.patch('/:id/done', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        status: 'error',
        message: 'Medication not found'
      });
    }

    medication.status = 'done';
    await medication.save();

    res.json({
      status: 'success',
      data: {
        medication
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router; 